import db from '../database.js';
import { DAILY_EPOCH } from '../config.js';
import type { AppError } from '../middleware/errorHandler.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DailyChallengeRow {
  id: number;
  date: string;
  puzzle_number: number;
  song_title: string;
  song_artist: string;
  song_id: string | null;
  spotify_preview_url: string | null;
  spotify_album_art: string | null;
}

export interface DailyGuessRow {
  id: number;
  date: string;
  user_id: string | null;
  session_id: string;
  guess_text: string;
  correct: number;
  attempt_number: number;
  time_ms: number | null;
  created_at: string;
}

export interface DailyChallengePublic {
  date: string;
  puzzleNumber: number;
  maxAttempts: number;
  attemptsUsed: number;
  completed: boolean;
  won: boolean | null;
}

export interface DailyGuessResult {
  correct: boolean;
  attemptsUsed: number;
  attemptsRemaining: number;
  maxAttempts: number;
  song?: {
    title: string;
    artist: string;
    id: string | null;
  };
}

export interface DailyResult {
  date: string;
  puzzleNumber: number;
  correct: boolean;
  attemptsUsed: number;
  maxAttempts: number;
  shareText: string;
  song: {
    title: string;
    artist: string;
    id: string | null;
  };
}

// ---------------------------------------------------------------------------
// Song catalog (mirrored from client/src/lib/songCatalog.ts)
// The server owns this copy so there is no dependency on client code.
// ---------------------------------------------------------------------------

interface CatalogSong {
  title: string;
  artist: string;
}

const SONG_CATALOG: CatalogSong[] = [
  // Classic Rock & Pop
  { title: 'Bohemian Rhapsody', artist: 'Queen' },
  { title: "Don't Stop Me Now", artist: 'Queen' },
  { title: 'We Will Rock You', artist: 'Queen' },
  { title: 'Hotel California', artist: 'Eagles' },
  { title: 'Stairway to Heaven', artist: 'Led Zeppelin' },
  { title: 'Smells Like Teen Spirit', artist: 'Nirvana' },
  { title: 'Yesterday', artist: 'The Beatles' },
  { title: 'Let It Be', artist: 'The Beatles' },
  { title: 'Hey Jude', artist: 'The Beatles' },
  { title: 'Come Together', artist: 'The Beatles' },
  { title: 'Purple Haze', artist: 'Jimi Hendrix' },
  { title: 'Sweet Home Alabama', artist: 'Lynyrd Skynyrd' },
  { title: 'Born to Run', artist: 'Bruce Springsteen' },
  { title: 'Like a Rolling Stone', artist: 'Bob Dylan' },
  { title: 'Imagine', artist: 'John Lennon' },
  { title: 'Piano Man', artist: 'Billy Joel' },
  { title: 'Uptown Girl', artist: 'Billy Joel' },

  // 80s & 90s Pop / R&B
  { title: 'Billie Jean', artist: 'Michael Jackson' },
  { title: 'Thriller', artist: 'Michael Jackson' },
  { title: 'Beat It', artist: 'Michael Jackson' },
  { title: 'Man in the Mirror', artist: 'Michael Jackson' },
  { title: 'I Will Always Love You', artist: 'Whitney Houston' },
  { title: 'Greatest Love of All', artist: 'Whitney Houston' },
  { title: 'Like a Virgin', artist: 'Madonna' },
  { title: 'Material Girl', artist: 'Madonna' },
  { title: "Papa Don't Preach", artist: 'Madonna' },
  { title: 'Take On Me', artist: 'a-ha' },
  { title: "Don't You (Forget About Me)", artist: 'Simple Minds' },
  { title: "Sweet Child O' Mine", artist: "Guns N' Roses" },
  { title: 'November Rain', artist: "Guns N' Roses" },
  { title: 'Under the Bridge', artist: 'Red Hot Chili Peppers' },
  { title: 'Losing My Religion', artist: 'R.E.M.' },
  { title: 'Everybody Hurts', artist: 'R.E.M.' },
  { title: 'No Scrubs', artist: 'TLC' },
  { title: 'Waterfalls', artist: 'TLC' },
  { title: 'I Want It That Way', artist: 'Backstreet Boys' },
  { title: 'Baby One More Time', artist: 'Britney Spears' },

  // 2000s Hits
  { title: 'Crazy in Love', artist: 'Beyoncé' },
  { title: 'Single Ladies', artist: 'Beyoncé' },
  { title: 'Halo', artist: 'Beyoncé' },
  { title: 'Yeah!', artist: 'Usher' },
  { title: 'Confessions Part II', artist: 'Usher' },
  { title: 'In Da Club', artist: '50 Cent' },
  { title: 'Hey Ya!', artist: 'OutKast' },
  { title: 'Lose Yourself', artist: 'Eminem' },
  { title: 'Without Me', artist: 'Eminem' },
  { title: 'Rolling in the Deep', artist: 'Adele' },
  { title: 'Someone Like You', artist: 'Adele' },
  { title: 'Hello', artist: 'Adele' },
  { title: 'Umbrella', artist: 'Rihanna' },
  { title: 'We Found Love', artist: 'Rihanna' },
  { title: 'Diamonds', artist: 'Rihanna' },
  { title: 'Just Dance', artist: 'Lady Gaga' },
  { title: 'Poker Face', artist: 'Lady Gaga' },
  { title: 'Bad Romance', artist: 'Lady Gaga' },
  { title: 'Love Story', artist: 'Taylor Swift' },
  { title: 'You Belong with Me', artist: 'Taylor Swift' },

  // 2010s Modern Hits
  { title: 'Shape of You', artist: 'Ed Sheeran' },
  { title: 'Thinking Out Loud', artist: 'Ed Sheeran' },
  { title: 'Perfect', artist: 'Ed Sheeran' },
  { title: 'Photograph', artist: 'Ed Sheeran' },
  { title: 'Shake It Off', artist: 'Taylor Swift' },
  { title: 'Blank Space', artist: 'Taylor Swift' },
  { title: 'Anti-Hero', artist: 'Taylor Swift' },
  { title: 'Bad Guy', artist: 'Billie Eilish' },
  { title: 'Happier Than Ever', artist: 'Billie Eilish' },
  { title: 'Ocean Eyes', artist: 'Billie Eilish' },
  { title: 'Blinding Lights', artist: 'The Weeknd' },
  { title: 'Starboy', artist: 'The Weeknd' },
  { title: 'Save Your Tears', artist: 'The Weeknd' },
  { title: "Can't Feel My Face", artist: 'The Weeknd' },
  { title: "God's Plan", artist: 'Drake' },
  { title: 'Hotline Bling', artist: 'Drake' },
  { title: 'One Dance', artist: 'Drake' },
  { title: 'HUMBLE.', artist: 'Kendrick Lamar' },
  { title: 'All the Stars', artist: 'Kendrick Lamar' },
  { title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars' },
  { title: "That's What I Like", artist: 'Bruno Mars' },
  { title: '24K Magic', artist: 'Bruno Mars' },
  { title: 'Locked Out of Heaven', artist: 'Bruno Mars' },
  { title: 'Happy', artist: 'Pharrell Williams' },
  { title: 'Get Lucky', artist: 'Daft Punk ft. Pharrell Williams' },
  { title: 'Somebody That I Used to Know', artist: 'Gotye ft. Kimbra' },
  { title: 'Call Me Maybe', artist: 'Carly Rae Jepsen' },
  { title: 'Stay', artist: 'Rihanna ft. Mikky Ekko' },

  // 2020s Hits
  { title: 'Levitating', artist: 'Dua Lipa' },
  { title: "Don't Start Now", artist: 'Dua Lipa' },
  { title: 'Physical', artist: 'Dua Lipa' },
  { title: 'drivers license', artist: 'Olivia Rodrigo' },
  { title: 'good 4 u', artist: 'Olivia Rodrigo' },
  { title: 'brutal', artist: 'Olivia Rodrigo' },
  { title: 'Industry Baby', artist: 'Lil Nas X ft. Jack Harlow' },
  { title: 'Montero (Call Me By Your Name)', artist: 'Lil Nas X' },
  { title: 'As It Was', artist: 'Harry Styles' },
  { title: 'Watermelon Sugar', artist: 'Harry Styles' },
  { title: 'Heat Waves', artist: 'Glass Animals' },
  { title: 'Stay', artist: 'The Kid LAROI & Justin Bieber' },
  { title: 'Peaches', artist: 'Justin Bieber ft. Daniel Caesar & Giveon' },
  { title: 'Easy On Me', artist: 'Adele' },
  { title: 'abcdefu', artist: 'GAYLE' },

  // Country
  { title: 'Jolene', artist: 'Dolly Parton' },
  { title: 'Friends in Low Places', artist: 'Garth Brooks' },
  { title: 'Humble and Kind', artist: 'Tim McGraw' },
  { title: 'Old Town Road', artist: 'Lil Nas X ft. Billy Ray Cyrus' },
  { title: 'Body Like a Back Road', artist: 'Sam Hunt' },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 6;

// ---------------------------------------------------------------------------
// Fuzzy matching helpers (mirrored from challengeService)
// ---------------------------------------------------------------------------

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
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
            dp[(i - 1) * (n + 1) + j],
            dp[i * (n + 1) + (j - 1)],
            dp[(i - 1) * (n + 1) + (j - 1)],
          );
      }
    }
  }

  return dp[m * (n + 1) + n];
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function isCorrectGuess(guess: string, title: string, artist: string): boolean {
  const normGuess = normalise(guess);
  const normTitle = normalise(title);
  const normArtist = normalise(artist);

  const THRESHOLD = 0.8;

  if (similarity(normGuess, normTitle) >= THRESHOLD) return true;

  const combined = normalise(`${title} - ${artist}`);
  if (similarity(normGuess, combined) >= THRESHOLD) return true;

  const combined2 = `${normTitle} ${normArtist}`;
  if (similarity(normGuess, combined2) >= THRESHOLD) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Share text builder
// ---------------------------------------------------------------------------

function buildDailyShareText(
  puzzleNumber: number,
  guesses: Pick<DailyGuessRow, 'correct'>[],
  won: boolean,
): string {
  const squares = Array.from({ length: MAX_ATTEMPTS }, (_, i) => {
    if (i >= guesses.length) return '⬜';
    return guesses[i].correct ? '🟩' : '🟥';
  });

  const scoreLabel = won ? `${guesses.length}/${MAX_ATTEMPTS}` : `X/${MAX_ATTEMPTS}`;
  return `🎵 HumDuel Daily #${puzzleNumber} ${scoreLabel}\n${squares.join('')}\nPlay at humduel.app/daily`;
}

// ---------------------------------------------------------------------------
// Operational error factory
// ---------------------------------------------------------------------------

function makeOperationalError(message: string, statusCode: number): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}

// ---------------------------------------------------------------------------
// Database prepared statements
// ---------------------------------------------------------------------------

const stmtSelectDailyChallenge = db.prepare<[string]>(
  'SELECT * FROM daily_challenges WHERE date = ?',
);

const stmtInsertDailyChallenge = db.prepare<{
  date: string;
  puzzle_number: number;
  song_title: string;
  song_artist: string;
  song_id: null;
  spotify_preview_url: null;
  spotify_album_art: null;
}>(`
  INSERT INTO daily_challenges
    (date, puzzle_number, song_title, song_artist, song_id, spotify_preview_url, spotify_album_art)
  VALUES
    (@date, @puzzle_number, @song_title, @song_artist, @song_id, @spotify_preview_url, @spotify_album_art)
`);

const stmtGetSessionDailyGuesses = db.prepare<[string, string]>(
  'SELECT * FROM daily_guesses WHERE date = ? AND session_id = ? ORDER BY attempt_number ASC',
);

const stmtInsertDailyGuess = db.prepare<{
  date: string;
  user_id: string | null;
  session_id: string;
  guess_text: string;
  correct: number;
  attempt_number: number;
  time_ms: number | null;
  created_at: string;
}>(`
  INSERT INTO daily_guesses
    (date, user_id, session_id, guess_text, correct, attempt_number, time_ms, created_at)
  VALUES
    (@date, @user_id, @session_id, @guess_text, @correct, @attempt_number, @time_ms, @created_at)
`);

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Returns today's date as YYYY-MM-DD in UTC.
 */
export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Calculate puzzle number as days elapsed since DAILY_EPOCH (inclusive).
 * Puzzle #1 corresponds to DAILY_EPOCH itself.
 */
export function getPuzzleNumber(date: string): number {
  const epochMs = Date.parse(DAILY_EPOCH);
  const dateMs = Date.parse(date);
  const diffDays = Math.round((dateMs - epochMs) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

/**
 * Deterministic song selection for a given date.
 *
 * Uses a simple djb2-style hash over the date string characters, multiplied
 * by a prime and taken modulo the catalog length. This guarantees the same
 * song is always returned for the same date, across restarts.
 */
export function selectSongForDate(date: string): { title: string; artist: string } {
  let hash = 5381;
  for (let i = 0; i < date.length; i++) {
    // hash * 33 + charCode
    hash = (hash * 33) ^ date.charCodeAt(i);
    // Keep within 32-bit signed integer range to avoid precision loss
    hash = hash & 0x7fffffff;
  }
  const index = hash % SONG_CATALOG.length;
  const song = SONG_CATALOG[index];
  return { title: song.title, artist: song.artist };
}

/**
 * Get or create the daily_challenges row for the given date.
 * Idempotent — safe to call multiple times for the same date.
 */
export function ensureDailyChallenge(date: string): DailyChallengeRow {
  const existing = stmtSelectDailyChallenge.get(date) as DailyChallengeRow | undefined;
  if (existing) return existing;

  const song = selectSongForDate(date);
  const puzzleNumber = getPuzzleNumber(date);

  stmtInsertDailyChallenge.run({
    date,
    puzzle_number: puzzleNumber,
    song_title: song.title,
    song_artist: song.artist,
    song_id: null,
    spotify_preview_url: null,
    spotify_album_art: null,
  });

  return stmtSelectDailyChallenge.get(date) as DailyChallengeRow;
}

/**
 * Return the public view of today's daily challenge for a given session.
 * The song answer is never included in this response.
 */
export function getDailyChallenge(date: string, sessionId: string): DailyChallengePublic {
  const challenge = ensureDailyChallenge(date);
  const guesses = stmtGetSessionDailyGuesses.all(date, sessionId) as DailyGuessRow[];

  const attemptsUsed = guesses.length;
  const won = guesses.some((g) => g.correct === 1);
  const completed = won || attemptsUsed >= MAX_ATTEMPTS;

  return {
    date: challenge.date,
    puzzleNumber: challenge.puzzle_number,
    maxAttempts: MAX_ATTEMPTS,
    attemptsUsed,
    completed,
    won: completed ? won : null,
  };
}

/**
 * Submit a guess for the daily challenge.
 *
 * - Enforces the MAX_ATTEMPTS cap per session.
 * - Uses the same fuzzy matching as the regular challenge service.
 * - Reveals the song only when the session is finished (won or exhausted).
 *
 * Throws an operational AppError for 409 (already finished).
 */
export function submitDailyGuess(
  date: string,
  guessText: string,
  sessionId: string,
  userId?: string,
): DailyGuessResult {
  const challenge = ensureDailyChallenge(date);
  const previousGuesses = stmtGetSessionDailyGuesses.all(date, sessionId) as DailyGuessRow[];

  const alreadyCorrect = previousGuesses.some((g) => g.correct === 1);
  if (alreadyCorrect) {
    throw makeOperationalError(
      'Daily challenge already completed correctly for this session',
      409,
    );
  }
  if (previousGuesses.length >= MAX_ATTEMPTS) {
    throw makeOperationalError('Maximum attempts reached for this session', 409);
  }

  const attemptNumber = previousGuesses.length + 1;
  const correct = isCorrectGuess(guessText, challenge.song_title, challenge.song_artist);

  // Record elapsed time from first guess in the session (0 for the first attempt)
  let timeTakenMs: number | null = null;
  if (previousGuesses.length === 0) {
    timeTakenMs = 0;
  } else {
    const firstAt = new Date(previousGuesses[0].created_at).getTime();
    timeTakenMs = Date.now() - firstAt;
  }

  stmtInsertDailyGuess.run({
    date,
    user_id: userId ?? null,
    session_id: sessionId,
    guess_text: guessText.trim(),
    correct: correct ? 1 : 0,
    attempt_number: attemptNumber,
    time_ms: timeTakenMs,
    created_at: new Date().toISOString(),
  });

  const attemptsUsed = attemptNumber;
  const attemptsRemaining = MAX_ATTEMPTS - attemptsUsed;
  const revealSong = correct || attemptsRemaining === 0;

  return {
    correct,
    attemptsUsed,
    attemptsRemaining,
    maxAttempts: MAX_ATTEMPTS,
    song: revealSong
      ? {
          title: challenge.song_title,
          artist: challenge.song_artist,
          id: challenge.song_id,
        }
      : undefined,
  };
}

/**
 * Return the completed result for a session, including the Wordle-style share
 * text. Returns null if the session has no guesses or is not yet finished.
 */
export function getDailyResult(date: string, sessionId: string): DailyResult | null {
  const challenge = stmtSelectDailyChallenge.get(date) as DailyChallengeRow | undefined;
  if (!challenge) return null;

  const guesses = stmtGetSessionDailyGuesses.all(date, sessionId) as DailyGuessRow[];
  if (guesses.length === 0) return null;

  const won = guesses.some((g) => g.correct === 1);
  const finished = won || guesses.length >= MAX_ATTEMPTS;
  if (!finished) return null;

  const shareText = buildDailyShareText(challenge.puzzle_number, guesses, won);

  return {
    date: challenge.date,
    puzzleNumber: challenge.puzzle_number,
    correct: won,
    attemptsUsed: guesses.length,
    maxAttempts: MAX_ATTEMPTS,
    shareText,
    song: {
      title: challenge.song_title,
      artist: challenge.song_artist,
      id: challenge.song_id,
    },
  };
}
