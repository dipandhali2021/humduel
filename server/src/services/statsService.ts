import { getDb } from '../database.js';

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
// Internal row shapes returned by database
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
  correct: number;           // 0 or 1
  attempt_number: number;
  time_ms: number | null;
}

// ---------------------------------------------------------------------------
// Service function
// ---------------------------------------------------------------------------

/**
 * Compute and return aggregated stats for a user.
 * Returns null if no user with the given id exists.
 */
export async function getUserStats(userId: string): Promise<UserStatsResult | null> {
  const db = await getDb();
  
  const userRow = await db.get<UserStatsRow>(
    `SELECT id, nickname, games_played, games_won, current_streak, best_streak
     FROM users
     WHERE id = $1`,
    [userId]
  );
  if (!userRow) return null;

  const gamesPlayed = userRow.games_played;
  const gamesWon = userRow.games_won;
  const winRate = gamesPlayed > 0 ? gamesWon / gamesPlayed : 0;

  const avgRow = await db.get<AvgTimeRow>(
    `SELECT AVG(time_ms) AS avg_ms
     FROM daily_guesses
     WHERE user_id = $1 AND correct = 1 AND time_ms IS NOT NULL`,
    [userId]
  );
  const avgTimeSeconds =
    avgRow?.avg_ms !== null && avgRow?.avg_ms !== undefined
      ? Math.round(avgRow.avg_ms) / 1000
      : null;

  const rawGames = await db.all<RecentGameRow>(
    `SELECT
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
    WHERE dg.user_id = $1
    GROUP BY dg.date, dc.puzzle_number
    ORDER BY dg.date DESC
    LIMIT 10`,
    [userId]
  );

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
