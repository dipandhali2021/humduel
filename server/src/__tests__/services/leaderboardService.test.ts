/**
 * Unit tests for leaderboardService.ts
 *
 * Mocking strategy:
 *   An in-memory SQLite database with an async wrapper is used.
 *   The getDb() function is mocked to return the async wrapper.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// vi.hoisted() — create the in-memory database before mocks run
// ---------------------------------------------------------------------------

const { testDb, asyncDb } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { fileURLToPath } = require('url') as typeof import('url');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const schemaPath = path.resolve(__dirname, '../../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(schema);

  // Parameter conversion: PostgreSQL $1, $2, ... to SQLite ?, ?, ...
  function convertToSqlite(sql: string, params?: unknown[]): { sql: string; params: unknown[] } {
    if (!params || params.length === 0) {
      return { sql: sql.replace(/\$\d+/g, '?'), params: [] };
    }
    const matches = sql.match(/\$(\d+)/g);
    if (!matches) {
      return { sql, params: params || [] };
    }
    const newParams: unknown[] = [];
    for (const match of matches) {
      const num = parseInt(match.slice(1), 10);
      if (num >= 1 && num <= params.length) {
        newParams.push(params[num - 1]);
      }
    }
    const newSql = sql.replace(/\$\d+/g, '?');
    return { sql: newSql, params: newParams };
  }

  // Create async wrapper around synchronous SQLite
  const asyncDb = {
    all: async <T>(sql: string, params?: unknown[]): Promise<T[]> => {
      const { sql: convertedSql, params: convertedParams } = convertToSqlite(sql, params);
      return db.prepare(convertedSql).all(convertedParams) as T[];
    },
    get: async <T>(sql: string, params?: unknown[]): Promise<T | null> => {
      const { sql: convertedSql, params: convertedParams } = convertToSqlite(sql, params);
      return (db.prepare(convertedSql).get(convertedParams) as T) ?? null;
    },
    run: async (sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowid: number | bigint }> => {
      const { sql: convertedSql, params: convertedParams } = convertToSqlite(sql, params);
      return db.prepare(convertedSql).run(convertedParams);
    },
    exec: async (sql: string): Promise<void> => {
      db.exec(sql);
    },
    close: async (): Promise<void> => {
      db.close();
    },
  };

  return { testDb: db, asyncDb };
});

// ---------------------------------------------------------------------------
// Replace the database module
// ---------------------------------------------------------------------------

vi.mock('../../database.js', () => ({
  getDb: async () => asyncDb,
  closeDb: async () => { testDb.close(); },
  isPostgres: false,
}));

// ---------------------------------------------------------------------------
// Import service under test after mocks are registered
// ---------------------------------------------------------------------------

const { getLeaderboard, getPlayerRank } = await import('../../services/leaderboardService.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let userCounter = 0;
function freshUserId(): string {
  return `lb-user-${++userCounter}`;
}

/** Insert a daily_challenges row for the given date / puzzle_number. */
function seedDailyChallenge(date: string, puzzleNumber = 1): void {
  testDb
    .prepare(
      `INSERT OR IGNORE INTO daily_challenges
         (date, puzzle_number, song_title, song_artist)
       VALUES (?, ?, 'Test Song', 'Test Artist')`,
    )
    .run(date, puzzleNumber);
}

/** Insert a user row. */
function seedUser(id: string, nickname: string): void {
  testDb
    .prepare(
      `INSERT INTO users (id, nickname, avatar, created_at)
       VALUES (?, ?, 'default', datetime('now'))`,
    )
    .run(id, nickname);
}

interface GuessParams {
  date: string;
  sessionId: string;
  userId?: string | null;
  attemptNumber: number;
  timeMs: number;
  correct?: boolean;
}

/** Insert a single daily_guesses row. */
function seedGuess(params: GuessParams): void {
  const {
    date,
    sessionId,
    userId = null,
    attemptNumber,
    timeMs,
    correct = false,
  } = params;

  testDb
    .prepare(
      `INSERT INTO daily_guesses
         (date, user_id, session_id, guess_text, correct, attempt_number, time_ms, created_at)
       VALUES (?, ?, ?, 'some guess', ?, ?, ?, datetime('now'))`,
    )
    .run(date, userId, sessionId, correct ? 1 : 0, attemptNumber, timeMs);
}

// ---------------------------------------------------------------------------
// Cleanup between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  testDb.exec('DELETE FROM daily_guesses');
  testDb.exec('DELETE FROM daily_challenges');
  testDb.exec('DELETE FROM users');
});

// ===========================================================================
// getLeaderboard
// ===========================================================================

describe('getLeaderboard', () => {
  it('returns empty entries array when no one has played', async () => {
    seedDailyChallenge('2026-04-01');
    const result = await getLeaderboard('2026-04-01');
    expect(result.entries).toEqual([]);
    expect(result.date).toBe('2026-04-01');
  });

  it('returns puzzleNumber of 0 when no daily_challenges row exists', async () => {
    const result = await getLeaderboard('2099-12-31');
    expect(result.puzzleNumber).toBe(0);
  });

  it('returns correct puzzleNumber from the daily_challenges row', async () => {
    seedDailyChallenge('2026-04-02', 7);
    const result = await getLeaderboard('2026-04-02');
    expect(result.puzzleNumber).toBe(7);
  });

  it('does not include sessions that only have wrong guesses', async () => {
    seedDailyChallenge('2026-04-03');
    seedGuess({
      date: '2026-04-03',
      sessionId: 'wrong-only',
      attemptNumber: 1,
      timeMs: 5000,
      correct: false,
    });

    const result = await getLeaderboard('2026-04-03');
    expect(result.entries).toEqual([]);
  });

  it('includes a session that has at least one correct guess', async () => {
    seedDailyChallenge('2026-04-04');
    seedGuess({
      date: '2026-04-04',
      sessionId: 'correct-session',
      attemptNumber: 2,
      timeMs: 10000,
      correct: true,
    });

    const result = await getLeaderboard('2026-04-04');
    expect(result.entries.length).toBe(1);
    expect(result.entries[0]!.attemptsUsed).toBe(2);
  });

  it('uses Anonymous nickname when no user_id is present', async () => {
    seedDailyChallenge('2026-04-05');
    seedGuess({
      date: '2026-04-05',
      sessionId: 'anon-session',
      attemptNumber: 1,
      timeMs: 3000,
      correct: true,
    });

    const result = await getLeaderboard('2026-04-05');
    expect(result.entries[0]!.nickname).toBe('Anonymous');
  });

  it('uses the users.nickname when user_id is present', async () => {
    seedDailyChallenge('2026-04-06');
    const userId = freshUserId();
    seedUser(userId, 'LeaderboardUser');
    seedGuess({
      date: '2026-04-06',
      sessionId: 'named-session',
      userId,
      attemptNumber: 1,
      timeMs: 2000,
      correct: true,
    });

    const result = await getLeaderboard('2026-04-06');
    expect(result.entries[0]!.nickname).toBe('LeaderboardUser');
  });

  it('sorts by attempts ASC, then time ASC', async () => {
    seedDailyChallenge('2026-04-07');

    seedGuess({
      date: '2026-04-07',
      sessionId: 'slow-2',
      attemptNumber: 2,
      timeMs: 50000,
      correct: true,
    });

    seedGuess({
      date: '2026-04-07',
      sessionId: 'fast-1',
      attemptNumber: 1,
      timeMs: 1000,
      correct: true,
    });

    seedGuess({
      date: '2026-04-07',
      sessionId: 'slow-1',
      attemptNumber: 1,
      timeMs: 5000,
      correct: true,
    });

    const result = await getLeaderboard('2026-04-07');

    // fast-1 should be first (attempt 1, 1s)
    // slow-1 should be second (attempt 1, 5s)
    // slow-2 should be third (attempt 2, 50s)
    expect(result.entries[0]!.attemptsUsed).toBe(1);
    expect(result.entries[0]!.timeTakenSeconds).toBe(1);
    expect(result.entries[1]!.attemptsUsed).toBe(1);
    expect(result.entries[1]!.timeTakenSeconds).toBe(5);
    expect(result.entries[2]!.attemptsUsed).toBe(2);
    expect(result.entries[2]!.timeTakenSeconds).toBe(50);
  });

  it('applies dense ranking — ties share the same rank', async () => {
    seedDailyChallenge('2026-04-08');

    seedGuess({
      date: '2026-04-08',
      sessionId: 't1',
      attemptNumber: 1,
      timeMs: 1000,
      correct: true,
    });

    seedGuess({
      date: '2026-04-08',
      sessionId: 't2',
      attemptNumber: 1,
      timeMs: 1000,
      correct: true,
    });

    seedGuess({
      date: '2026-04-08',
      sessionId: 't3',
      attemptNumber: 2,
      timeMs: 5000,
      correct: true,
    });

    const result = await getLeaderboard('2026-04-08');

    // t1 and t2 tie for rank 1; t3 is rank 2
    expect(result.entries[0]!.rank).toBe(1);
    expect(result.entries[1]!.rank).toBe(1);
    expect(result.entries[2]!.rank).toBe(2);
  });

  it('timeTakenSeconds is rounded from milliseconds', async () => {
    seedDailyChallenge('2026-04-09');
    seedGuess({
      date: '2026-04-09',
      sessionId: 'rounding-test',
      attemptNumber: 3,
      timeMs: 12345,
      correct: true,
    });

    const result = await getLeaderboard('2026-04-09');
    expect(result.entries[0]!.timeTakenSeconds).toBe(12);
  });

  it('returns userId alongside each entry', async () => {
    seedDailyChallenge('2026-04-10');
    const userId = freshUserId();
    seedUser(userId, 'RankUser');
    seedGuess({
      date: '2026-04-10',
      sessionId: 'with-user',
      userId,
      attemptNumber: 1,
      timeMs: 1000,
      correct: true,
    });

    const result = await getLeaderboard('2026-04-10');
    expect(result.entries[0]!.userId).toBe(userId);
  });
});

// ===========================================================================
// getPlayerRank
// ===========================================================================

describe('getPlayerRank', () => {
  it('returns null when the session has no correct guess', async () => {
    seedDailyChallenge('2026-04-20');
    seedGuess({
      date: '2026-04-20',
      sessionId: 'no-correct',
      attemptNumber: 1,
      timeMs: 1000,
      correct: false,
    });

    const rank = await getPlayerRank('2026-04-20', 'no-correct');
    expect(rank).toBeNull();
  });

  it('returns null when the session does not exist', async () => {
    seedDailyChallenge('2026-04-21');
    const rank = await getPlayerRank('2026-04-21', 'nonexistent-session');
    expect(rank).toBeNull();
  });

  it('returns 1 when the session is the only correct one', async () => {
    seedDailyChallenge('2026-04-22');
    seedGuess({
      date: '2026-04-22',
      sessionId: 'solo-winner',
      attemptNumber: 1,
      timeMs: 1000,
      correct: true,
    });

    const rank = await getPlayerRank('2026-04-22', 'solo-winner');
    expect(rank).toBe(1);
  });

  it('returns the correct rank when multiple sessions have won', async () => {
    seedDailyChallenge('2026-04-23');

    // Best: 1 attempt, 1s
    seedGuess({
      date: '2026-04-23',
      sessionId: 'best',
      attemptNumber: 1,
      timeMs: 1000,
      correct: true,
    });

    // Middle: 1 attempt, 5s
    seedGuess({
      date: '2026-04-23',
      sessionId: 'middle',
      attemptNumber: 1,
      timeMs: 5000,
      correct: true,
    });

    // Worst: 2 attempts, 10s
    seedGuess({
      date: '2026-04-23',
      sessionId: 'worst',
      attemptNumber: 2,
      timeMs: 10000,
      correct: true,
    });

    const rankBest = await getPlayerRank('2026-04-23', 'best');
    const rankMiddle = await getPlayerRank('2026-04-23', 'middle');
    const rankWorst = await getPlayerRank('2026-04-23', 'worst');

    expect(rankBest).toBe(1);
    expect(rankMiddle).toBe(2);
    expect(rankWorst).toBe(3);
  });

  it('ties in rank produce the same rank number', async () => {
    seedDailyChallenge('2026-04-24');

    seedGuess({
      date: '2026-04-24',
      sessionId: 'tie-a',
      attemptNumber: 2,
      timeMs: 5000,
      correct: true,
    });

    seedGuess({
      date: '2026-04-24',
      sessionId: 'tie-b',
      attemptNumber: 2,
      timeMs: 5000,
      correct: true,
    });

    seedGuess({
      date: '2026-04-24',
      sessionId: 'better',
      attemptNumber: 1,
      timeMs: 1000,
      correct: true,
    });

    const rankA = await getPlayerRank('2026-04-24', 'tie-a');
    const rankB = await getPlayerRank('2026-04-24', 'tie-b');

    // Both tie-a and tie-b have same attempts/time, should have same rank (2)
    expect(rankA).toBe(rankB);
    expect(rankA).toBe(2);
  });
});
