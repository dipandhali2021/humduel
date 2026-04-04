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
