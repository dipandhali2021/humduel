import { nanoid } from 'nanoid';
import { getDb } from '../database.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChallengeRow {
  id: string;
  creator_name: string;
  audio_filename: string;
  waveform_data: string;
  song_title: string;
  song_artist: string;
  song_id: string | null;
  duration_seconds: number;
  created_at: string;
  expires_at: string;
}

export interface GuessRow {
  id: number;
  challenge_id: string;
  guesser_name: string | null;
  song_title: string;
  song_artist: string;
  correct: number;
  attempt_number: number;
  time_ms: number | null;
  session_id: string | null;
  created_at: string;
}

export interface CreateChallengeData {
  waveformData: number[];
  songTitle: string;
  songArtist: string;
  songId?: string;
  durationSeconds: number;
  creatorAlias?: string;
  audioFilename: string;
}

export interface ChallengePublic {
  id: string;
  audioUrl: string;
  waveformData: number[];
  durationSeconds: number;
  creatorAlias: string;
  guessCount: number;
  completionCount: number;
  maxAttempts: number;
  expiresAt: string;
  createdAt: string;
}

export interface CreatedChallenge {
  id: string;
  challengeUrl: string;
  expiresAt: string;
  createdAt: string;
}

export interface SubmitGuessResult {
  correct: boolean;
  attemptsUsed: number;
  attemptsRemaining: number;
  maxAttempts: number;
  timeTakenSeconds: number | null;
  sessionId: string;
  song?: {
    title: string;
    artist: string;
    id: string | null;
  };
}

export interface ChallengeResult {
  id: string;
  correct: boolean;
  attemptsUsed: number;
  maxAttempts: number;
  shareText: string;
  waveformData: number[];
  song: {
    title: string;
    artist: string;
    id: string | null;
  };
  expiresAt: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 6;
const EXPIRY_DAYS = 7;

// ---------------------------------------------------------------------------
// Fuzzy matching helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a string for comparison: lowercase, strip punctuation, collapse
 * whitespace.
 */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compute the Levenshtein edit distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Use a flat 1-D array for the DP table to keep memory tight.
  const dp: number[] = Array.from({ length: (m + 1) * (n + 1) }, () => 0);

  for (let i = 0; i <= m; i++) dp[i * (n + 1)] = i;
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i * (n + 1) + j] = dp[(i - 1) * (n + 1) + (j - 1)];
      } else {
        dp[i * (n + 1) + j] =
          1 +
          Math.min(
            dp[(i - 1) * (n + 1) + j], // deletion
            dp[i * (n + 1) + (j - 1)], // insertion
            dp[(i - 1) * (n + 1) + (j - 1)], // substitution
          );
      }
    }
  }

  return dp[m * (n + 1) + n];
}

/**
 * Return a similarity ratio in [0, 1] between two normalised strings.
 * Uses Levenshtein distance relative to the longer string.
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Determine whether a player's guess matches the answer.
 *
 * Accepted formats:
 *   - Song title only                 (similarity >= 0.8)
 *   - "title - artist" / "title artist" (similarity >= 0.8)
 */
function isCorrectGuess(guess: string, title: string, artist: string): boolean {
  const normGuess = normalise(guess);
  const normTitle = normalise(title);
  const normArtist = normalise(artist);

  const THRESHOLD = 0.8;

  // Match against title alone
  if (similarity(normGuess, normTitle) >= THRESHOLD) return true;

  // Match against "title - artist" (normalised separator stripped)
  const combined = normalise(`${title} - ${artist}`);
  if (similarity(normGuess, combined) >= THRESHOLD) return true;

  // Match against "title artist" (no separator)
  const combined2 = `${normTitle} ${normArtist}`;
  if (similarity(normGuess, combined2) >= THRESHOLD) return true;

  return false;
}

// ---------------------------------------------------------------------------
// ISO-8601 helpers
// ---------------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}

function expiryIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + EXPIRY_DAYS);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Wordle-style share text
// ---------------------------------------------------------------------------

/**
 * Generate a Wordle-style share text using coloured squares.
 *
 * Each attempt slot is represented as:
 *   🟩  correct guess
 *   🟥  wrong guess
 *   ⬜  unused slot
 */
function buildShareText(
  challengeId: string,
  attempts: Pick<GuessRow, 'correct'>[],
  won: boolean,
): string {
  const squares = Array.from({ length: MAX_ATTEMPTS }, (_, i) => {
    if (i >= attempts.length) return '⬜';
    return attempts[i].correct ? '🟩' : '🟥';
  });

  const scoreLabel = won ? `${attempts.length}/${MAX_ATTEMPTS}` : `X/${MAX_ATTEMPTS}`;
  return `HumDuel #${challengeId.slice(0, 6)} ${scoreLabel}\n${squares.join('')}\nhttps://humduel.app/c/${challengeId}`;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Insert a challenge row using a caller-supplied id.
 * The id must already be unique and used to name the audio file.
 */
export async function createChallengeWithId(
  id: string,
  data: CreateChallengeData,
): Promise<CreatedChallenge> {
  const db = await getDb();
  const now = nowIso();
  const expires = expiryIso();

  await db.run(
    `INSERT INTO challenges
      (id, creator_name, audio_filename, waveform_data, song_title, song_artist, song_id, duration_seconds, created_at, expires_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      id,
      data.creatorAlias?.trim() || 'Anonymous',
      data.audioFilename,
      JSON.stringify(data.waveformData),
      data.songTitle.trim(),
      data.songArtist.trim(),
      data.songId ?? null,
      data.durationSeconds,
      now,
      expires,
    ]
  );

  return {
    id,
    challengeUrl: `/c/${id}`,
    expiresAt: expires,
    createdAt: now,
  };
}

/**
 * Insert a challenge row, generating a new 8-char nanoid.
 * Convenience wrapper around createChallengeWithId.
 */
export async function createChallenge(data: CreateChallengeData): Promise<CreatedChallenge> {
  return createChallengeWithId(nanoid(8), data);
}

/**
 * Retrieve a challenge without revealing the song answer.
 * Returns null if not found.
 */
export async function getChallenge(id: string): Promise<ChallengePublic | null> {
  const db = await getDb();
  const row = await db.get<ChallengeRow>('SELECT * FROM challenges WHERE id = $1', [id]);
  if (!row) return null;

  const guessCountRow = await db.get<{ cnt: string }>(
    'SELECT COUNT(*) AS cnt FROM guesses WHERE challenge_id = $1',
    [row.id]
  );
  const completionCountRow = await db.get<{ cnt: string }>(
    'SELECT COUNT(DISTINCT session_id) AS cnt FROM guesses WHERE challenge_id = $1 AND correct = 1 AND session_id IS NOT NULL',
    [row.id]
  );

  return {
    id: row.id,
    audioUrl: `/audio/${row.audio_filename}`,
    waveformData: JSON.parse(row.waveform_data) as number[],
    durationSeconds: row.duration_seconds,
    creatorAlias: row.creator_name,
    guessCount: parseInt(guessCountRow?.cnt ?? '0', 10),
    completionCount: parseInt(completionCountRow?.cnt ?? '0', 10),
    maxAttempts: MAX_ATTEMPTS,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

/**
 * Submit a guess for a challenge.
 *
 * - Generates a sessionId if one is not provided.
 * - Enforces the MAX_ATTEMPTS cap per session.
 * - Returns the evaluation result (song only revealed when correct or all attempts used).
 *
 * Throws an operational AppError for 404, 409, 410 cases.
 */
export async function submitGuess(
  challengeId: string,
  guessText: string,
  sessionId?: string,
): Promise<SubmitGuessResult> {
  const db = await getDb();
  const row = await db.get<ChallengeRow>('SELECT * FROM challenges WHERE id = $1', [challengeId]);

  if (!row) {
    const err = new Error('Challenge not found') as Error & {
      statusCode: number;
      isOperational: boolean;
    };
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  if (new Date(row.expires_at) < new Date()) {
    const err = new Error('Challenge has expired') as Error & {
      statusCode: number;
      isOperational: boolean;
    };
    err.statusCode = 410;
    err.isOperational = true;
    throw err;
  }

  // Ensure we have a sessionId to track attempts
  const resolvedSessionId = sessionId?.trim() || nanoid(16);

  const previousGuesses = await db.all<GuessRow>(
    'SELECT * FROM guesses WHERE challenge_id = $1 AND session_id = $2 ORDER BY attempt_number ASC',
    [challengeId, resolvedSessionId]
  );

  // Check if session is already finished
  const alreadyCorrect = previousGuesses.some((g) => g.correct === 1);
  if (alreadyCorrect || previousGuesses.length >= MAX_ATTEMPTS) {
    const err = new Error(
      alreadyCorrect
        ? 'Challenge already completed correctly for this session'
        : 'Maximum attempts reached for this session',
    ) as Error & { statusCode: number; isOperational: boolean };
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  const attemptNumber = previousGuesses.length + 1;
  const correct = isCorrectGuess(guessText, row.song_title, row.song_artist);
  const now = nowIso();

  // Compute elapsed time from the challenge creation for the first guess,
  // or from the first guess in this session for subsequent guesses.
  let timeTakenMs: number | null = null;
  if (previousGuesses.length === 0) {
    timeTakenMs = 0;
  } else {
    const firstAt = new Date(previousGuesses[0].created_at).getTime();
    timeTakenMs = Date.now() - firstAt;
  }

  await db.run(
    `INSERT INTO guesses
      (challenge_id, guesser_name, song_title, song_artist, correct, attempt_number, time_ms, session_id, created_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      challengeId,
      null,
      guessText.trim(),
      '',
      correct ? 1 : 0,
      attemptNumber,
      timeTakenMs,
      resolvedSessionId,
      now,
    ]
  );

  const attemptsUsed = attemptNumber;
  const attemptsRemaining = MAX_ATTEMPTS - attemptsUsed;
  const revealSong = correct || attemptsRemaining === 0;

  return {
    correct,
    attemptsUsed,
    attemptsRemaining,
    maxAttempts: MAX_ATTEMPTS,
    timeTakenSeconds: timeTakenMs !== null ? Math.round(timeTakenMs / 1000) : null,
    sessionId: resolvedSessionId,
    song: revealSong
      ? {
          title: row.song_title,
          artist: row.song_artist,
          id: row.song_id,
        }
      : undefined,
  };
}

/**
 * Return the complete result for a finished session including share text.
 * Returns null if the challenge or session does not exist / has no guesses.
 */
export async function getResult(
  challengeId: string,
  sessionId: string,
): Promise<ChallengeResult | null> {
  const db = await getDb();
  const row = await db.get<ChallengeRow>('SELECT * FROM challenges WHERE id = $1', [challengeId]);
  if (!row) return null;

  const guesses = await db.all<GuessRow>(
    'SELECT * FROM guesses WHERE challenge_id = $1 AND session_id = $2 ORDER BY attempt_number ASC',
    [challengeId, sessionId]
  );
  if (guesses.length === 0) return null;

  const won = guesses.some((g) => g.correct === 1);
  const shareText = buildShareText(challengeId, guesses, won);

  return {
    id: challengeId,
    correct: won,
    attemptsUsed: guesses.length,
    maxAttempts: MAX_ATTEMPTS,
    shareText,
    waveformData: JSON.parse(row.waveform_data) as number[],
    song: {
      title: row.song_title,
      artist: row.song_artist,
      id: row.song_id,
    },
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}
