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

// ─── Sprint 3 API types ───────────────────────────────────────────────────────

/** Response from GET /api/daily */
export interface DailyChallengeResponse {
  date: string;
  puzzleNumber: number;
  songHint: string;
  maxAttempts: number;
  attemptsUsed: number;
  completed: boolean;
  correct: boolean | null;
}

/** Response from POST /api/daily/guess */
export interface DailyGuessResponse {
  correct: boolean;
  attemptsUsed: number;
  attemptsRemaining: number;
  maxAttempts: number;
  timeTakenSeconds: number | null;
  song: SongMatch | null;
}

/** Response from GET /api/daily/result */
export interface DailyResultResponse {
  date: string;
  puzzleNumber: number;
  completed: boolean;
  correct: boolean;
  attemptsUsed: number;
  maxAttempts: number;
  timeTakenSeconds: number | null;
  song: SongMatch;
  shareText: string;
}

/** Response from GET /api/leaderboard */
export interface LeaderboardResponse {
  date: string;
  puzzleNumber: number;
  entries: LeaderboardEntryResponse[];
}

export interface LeaderboardEntryResponse {
  rank: number;
  nickname: string;
  userId: string;
  attemptsUsed: number;
  timeTakenSeconds: number;
  completedAt: string;
}

/** Response from POST /api/users or GET /api/users/:id */
export interface UserResponse {
  id: string;
  nickname: string;
  avatar: string;
  createdAt: string;
}

/** Response from GET /api/users/:id/stats */
export interface UserStatsResponse {
  userId: string;
  nickname: string;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  avgTimeSeconds: number | null;
  recentGames: RecentGame[];
}

export interface RecentGame {
  date: string;
  puzzleNumber: number;
  correct: boolean;
  attemptsUsed: number;
  timeTakenSeconds: number | null;
}

/** Spotify-enhanced song search result */
export interface SpotifySongResult {
  title: string;
  artist: string;
  spotifyId: string | null;
  albumArt: string | null;
  previewUrl: string | null;
}
