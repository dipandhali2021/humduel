import { getDb } from '../database.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  rank: number;
  nickname: string;
  userId: string | null;
  attemptsUsed: number;
  timeTakenSeconds: number;
  completedAt: string;
}

export interface LeaderboardResult {
  date: string;
  puzzleNumber: number;
  entries: LeaderboardEntry[];
}

// ---------------------------------------------------------------------------
// Internal row shapes returned by database
// ---------------------------------------------------------------------------

interface LeaderboardRow {
  session_id: string;
  user_id: string | null;
  nickname: string | null;
  attempt_number: number;
  time_ms: number;
  created_at: string;
}

interface PuzzleNumberRow {
  puzzle_number: number;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Return the ranked leaderboard for a given date.
 *
 * Ranking is by fewest attempts (ASC), then fastest time (ASC).  Ties share
 * the same rank (dense-rank semantics implemented in application code).
 */
export async function getLeaderboard(date: string): Promise<LeaderboardResult> {
  const db = await getDb();
  
  const rows = await db.all<LeaderboardRow>(
    `SELECT
      dg.session_id,
      dg.user_id,
      COALESCE(u.nickname, 'Anonymous') AS nickname,
      dg.attempt_number,
      dg.time_ms,
      dg.created_at
    FROM daily_guesses dg
    LEFT JOIN users u ON dg.user_id = u.id
    WHERE dg.date = $1
      AND dg.correct = 1
    ORDER BY dg.attempt_number ASC, dg.time_ms ASC`,
    [date]
  );

  const puzzleRow = await db.get<PuzzleNumberRow>(
    'SELECT puzzle_number FROM daily_challenges WHERE date = $1 LIMIT 1',
    [date]
  );
  const puzzleNumber = puzzleRow?.puzzle_number ?? 0;

  // Assign dense ranks: same (attempts, time) => same rank.
  const entries: LeaderboardEntry[] = [];
  let currentRank = 0;
  let prevAttempts: number | null = null;
  let prevTime: number | null = null;

  for (const row of rows) {
    const isTie =
      prevAttempts !== null &&
      prevTime !== null &&
      row.attempt_number === prevAttempts &&
      row.time_ms === prevTime;

    if (!isTie) {
      currentRank += 1;
    }

    entries.push({
      rank: currentRank,
      nickname: row.nickname ?? 'Anonymous',
      userId: row.user_id,
      attemptsUsed: row.attempt_number,
      timeTakenSeconds: Math.round(row.time_ms / 1000),
      completedAt: row.created_at,
    });

    prevAttempts = row.attempt_number;
    prevTime = row.time_ms;
  }

  return { date, puzzleNumber, entries };
}

/**
 * Return the rank for a specific session on the given date, or null if the
 * session has not yet correctly guessed.
 *
 * Rank is 1-based and uses the same dense-rank criteria as getLeaderboard.
 */
export async function getPlayerRank(date: string, sessionId: string): Promise<number | null> {
  const db = await getDb();
  
  interface CorrectRow {
    attempt_number: number;
    time_ms: number;
  }

  const correct = await db.get<CorrectRow>(
    'SELECT attempt_number, time_ms FROM daily_guesses WHERE date = $1 AND session_id = $2 AND correct = 1 LIMIT 1',
    [date, sessionId]
  );
  if (!correct) return null;

  interface CountRow {
    cnt: string;
  }

  // Count sessions that strictly beat this session.
  const betterRow = await db.get<CountRow>(
    `SELECT COUNT(*) AS cnt
     FROM daily_guesses
     WHERE date = $1
       AND correct = 1
       AND (
         attempt_number < $2
         OR (attempt_number = $3 AND time_ms < $4)
       )`,
    [date, correct.attempt_number, correct.attempt_number, correct.time_ms]
  );

  // Rank = number of sessions that beat us + 1.
  return parseInt(betterRow?.cnt ?? '0', 10) + 1;
}
