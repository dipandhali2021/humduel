import db from '../database.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecentGame {
  date: string;
  puzzleNumber: number;
  correct: boolean;
  attemptsUsed: number;
  timeTakenSeconds: number | null;
}

export interface UserStatsResult {
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

// ---------------------------------------------------------------------------
// Internal row shapes returned by SQLite
// ---------------------------------------------------------------------------

interface UserStatsRow {
  id: string;
  nickname: string;
  games_played: number;
  games_won: number;
  current_streak: number;
  best_streak: number;
}

interface AvgTimeRow {
  avg_ms: number | null;
}

interface RecentGameRow {
  date: string;
  puzzle_number: number | null;
  correct: number;           // 0 or 1 (SQLite integer)
  attempt_number: number;
  time_ms: number | null;
}

// ---------------------------------------------------------------------------
// Prepared statements
// ---------------------------------------------------------------------------

const stmtUserStats = db.prepare<[string]>(`
  SELECT id, nickname, games_played, games_won, current_streak, best_streak
  FROM users
  WHERE id = ?
`);

/**
 * Average time (ms) across all correctly guessed daily puzzles for this user.
 * Only rows where correct = 1 and time_ms is not NULL contribute.
 */
const stmtAvgTime = db.prepare<[string]>(`
  SELECT AVG(time_ms) AS avg_ms
  FROM daily_guesses
  WHERE user_id = ? AND correct = 1 AND time_ms IS NOT NULL
`);

/**
 * Last 10 daily puzzle results for this user, most recent first.
 *
 * For each date we want:
 *   - whether they got it right (MAX(correct) = 1 if any guess was correct)
 *   - the attempt number they got it on (or the last attempt if they lost)
 *   - the time_ms of the final attempt
 *   - the puzzle_number from daily_challenges (left-joined, may be NULL)
 *
 * Because each row in daily_guesses is one guess, we need to aggregate per
 * (user_id, date).  The correct guess row is identified by correct = 1;
 * if there is no correct guess we fall back to the last attempt.
 */
const stmtRecentGames = db.prepare<[string]>(`
  SELECT
    dg.date,
    dc.puzzle_number,
    MAX(dg.correct) AS correct,
    CASE
      WHEN MAX(dg.correct) = 1 THEN
        MIN(CASE WHEN dg.correct = 1 THEN dg.attempt_number ELSE NULL END)
      ELSE
        MAX(dg.attempt_number)
    END AS attempt_number,
    CASE
      WHEN MAX(dg.correct) = 1 THEN
        MIN(CASE WHEN dg.correct = 1 THEN dg.time_ms ELSE NULL END)
      ELSE
        NULL
    END AS time_ms
  FROM daily_guesses dg
  LEFT JOIN daily_challenges dc ON dc.date = dg.date
  WHERE dg.user_id = ?
  GROUP BY dg.date
  ORDER BY dg.date DESC
  LIMIT 10
`);

// ---------------------------------------------------------------------------
// Service function
// ---------------------------------------------------------------------------

/**
 * Compute and return aggregated stats for a user.
 * Returns null if no user with the given id exists.
 */
export function getUserStats(userId: string): UserStatsResult | null {
  const userRow = stmtUserStats.get(userId) as UserStatsRow | undefined;
  if (!userRow) return null;

  const gamesPlayed = userRow.games_played;
  const gamesWon = userRow.games_won;
  const winRate = gamesPlayed > 0 ? gamesWon / gamesPlayed : 0;

  const avgRow = stmtAvgTime.get(userId) as AvgTimeRow;
  const avgTimeSeconds =
    avgRow.avg_ms !== null && avgRow.avg_ms !== undefined
      ? Math.round(avgRow.avg_ms) / 1000
      : null;

  const rawGames = stmtRecentGames.all(userId) as RecentGameRow[];

  const recentGames: RecentGame[] = rawGames.map((row) => ({
    date: row.date,
    puzzleNumber: row.puzzle_number ?? 0,
    correct: row.correct === 1,
    attemptsUsed: row.attempt_number,
    timeTakenSeconds: row.time_ms !== null ? Math.round(row.time_ms / 1000) : null,
  }));

  return {
    userId: userRow.id,
    nickname: userRow.nickname,
    gamesPlayed,
    gamesWon,
    winRate,
    currentStreak: userRow.current_streak,
    bestStreak: userRow.best_streak,
    avgTimeSeconds,
    recentGames,
  };
}
