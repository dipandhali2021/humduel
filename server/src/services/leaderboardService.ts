import db from '../database.js';

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
// Internal row shapes returned by SQLite
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
// Prepared statements
// ---------------------------------------------------------------------------

/**
 * For each session that correctly guessed on the given date, return the row
 * corresponding to their correct guess (attempt_number, time_ms, created_at).
 *
 * SQLite does not support FILTER or HAVING on aggregated chosen rows
 * directly, so we inner-join daily_guesses with itself to pick only the
 * correct row, then left-join to users for the nickname.
 */
const stmtLeaderboard = db.prepare<[string]>(`
  SELECT
    dg.session_id,
    dg.user_id,
    COALESCE(u.nickname, 'Anonymous') AS nickname,
    dg.attempt_number,
    dg.time_ms,
    dg.created_at
  FROM daily_guesses dg
  LEFT JOIN users u ON dg.user_id = u.id
  WHERE dg.date = ?
    AND dg.correct = 1
  ORDER BY dg.attempt_number ASC, dg.time_ms ASC
`);

const stmtPuzzleNumber = db.prepare<[string]>(`
  SELECT puzzle_number FROM daily_challenges WHERE date = ? LIMIT 1
`);

/**
 * Fetch the single correct guess row for a specific session on a given date,
 * used by getPlayerRank to retrieve ranking information without recomputing
 * the entire leaderboard.
 */
const stmtSessionCorrectGuess = db.prepare<[string, string]>(`
  SELECT attempt_number, time_ms
  FROM daily_guesses
  WHERE date = ? AND session_id = ? AND correct = 1
  LIMIT 1
`);

/**
 * Count how many sessions beat or tie the given session's score.
 * A session "beats" another when its attempt_number < theirs, or
 * attempt_number is equal and time_ms < theirs.
 */
const stmtCountBetterSessions = db.prepare<[string, number, number, number]>(`
  SELECT COUNT(*) AS cnt
  FROM daily_guesses
  WHERE date = (SELECT date FROM daily_guesses WHERE session_id = ? AND correct = 1 LIMIT 1)
    AND correct = 1
    AND (
      attempt_number < ?
      OR (attempt_number = ? AND time_ms < ?)
    )
`);

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Return the ranked leaderboard for a given date.
 *
 * Ranking is by fewest attempts (ASC), then fastest time (ASC).  Ties share
 * the same rank (dense-rank semantics implemented in application code since
 * better-sqlite3 targets SQLite 3.x which may not have DENSE_RANK available
 * in all deployed versions).
 */
export function getLeaderboard(date: string): LeaderboardResult {
  const rows = stmtLeaderboard.all(date) as LeaderboardRow[];

  const puzzleRow = stmtPuzzleNumber.get(date) as PuzzleNumberRow | undefined;
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
export function getPlayerRank(date: string, sessionId: string): number | null {
  interface CorrectRow {
    attempt_number: number;
    time_ms: number;
  }

  const correct = stmtSessionCorrectGuess.get(date, sessionId) as CorrectRow | undefined;
  if (!correct) return null;

  interface CountRow {
    cnt: number;
  }

  // Count sessions that strictly beat this session.
  const betterRow = stmtCountBetterSessions.get(
    sessionId,
    correct.attempt_number,
    correct.attempt_number,
    correct.time_ms,
  ) as CountRow;

  // Rank = number of sessions that beat us + 1.
  return betterRow.cnt + 1;
}
