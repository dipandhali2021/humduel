// ─── Legacy types (kept for backward compatibility with Sprint 1 code) ────────

export interface Challenge {
  id: string;
  creatorName: string;
  audioUrl: string;
  waveformData: number[];
  songAnswer: SongInfo;
  createdAt: string;
  expiresAt: string;
}

export interface SongInfo {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  previewUrl?: string;
}

export interface GuessResult {
  correct: boolean;
  attempts: number;
  maxAttempts: number;
  timeMs: number;
  song: SongInfo;
}

export interface DailyChallenge {
  id: string;
  date: string;
  puzzleNumber: number;
  audioUrl: string;
  waveformData: number[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  timeMs: number;
  attempts: number;
  date: string;
}

export interface UserStats {
  gamesPlayed: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  avgTimeMs: number;
}

export type RecordingState =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'preview'
  | 'uploading';

export type GuessingState =
  | 'loading'
  | 'ready'
  | 'listening'
  | 'searching'
  | 'guessing'
  | 'result';

// ─── Sprint 2 API types ───────────────────────────────────────────────────────

/**
 * Challenge as returned by GET /api/challenges/:id.
 * Does NOT include the song answer — that would spoil the game.
 */
export interface ChallengeResponse {
  id: string;
  audioUrl: string;
  waveformData: number[];
  durationSeconds: number;
  creatorAlias: string | null;
  guessCount: number;
  completionCount: number;
  maxAttempts: number;
  expiresAt: string;
  createdAt: string;
}

/** Response from POST /api/challenges */
export interface CreateChallengeResponse {
  id: string;
  challengeUrl: string;
  expiresAt: string;
  createdAt: string;
}

/** Response from POST /api/challenges/:id/guess */
export interface GuessResponse {
  correct: boolean;
  attemptsUsed: number;
  attemptsRemaining: number;
  maxAttempts: number;
  timeTakenSeconds: number;
  song: SongMatch | null;
}

/** Song data returned alongside a guess or result. */
export interface SongMatch {
  title: string;
  artist: string;
  spotifyId: string | null;
  albumArt: string | null;
  previewUrl: string | null;
}

/** Response from GET /api/challenges/:id/result */
export interface ChallengeResultResponse {
  challengeId: string;
  completed: boolean;
  correct: boolean | null;
  attemptsUsed: number | null;
  maxAttempts: number;
  timeTakenSeconds: number | null;
  song: SongMatch | null;
  shareText: string | null;
  waveformData: number[];
  creatorAlias: string | null;
  completionCount: number;
  guessCount: number;
}

/** Individual song search result (used in the guessing UI). */
export interface SongSearchResult {
  title: string;
  artist: string;
}
