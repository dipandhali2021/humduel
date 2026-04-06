/**
 * Unit tests for statsService.ts
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

const { getUserStats } = await import('../../services/statsService.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let idCounter = 0;
function freshUserId(): string {
  return `stats-user-${++idCounter}`;
}

let sessionCounter = 0;
function freshSession(): string {
  return `stats-session-${++sessionCounter}`;
}

interface SeedUserParams {
  id: string;
  nickname?: string;
  gamesPlayed?: number;
  gamesWon?: number;
  currentStreak?: number;
  bestStreak?: number;
  lastPlayedDate?: string | null;
}

/** Insert a user row with explicit stat values. */
function seedUser(params: SeedUserParams): void {
  const {
    id,
    nickname = `Nick-${id}`,
    gamesPlayed = 0,
    gamesWon = 0,
    currentStreak = 0,
    bestStreak = 0,
    lastPlayedDate = null,
  } = params;

  testDb
    .prepare(
      `INSERT INTO users
         (id, nickname, avatar, games_played, games_won, current_streak, best_streak, last_played_date, created_at)
       VALUES (?, ?, 'default', ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .run(id, nickname, gamesPlayed, gamesWon, currentStreak, bestStreak, lastPlayedDate);
}

/** Insert a daily_challenges row for the given date. */
function seedDailyChallenge(date: string, puzzleNumber: number): void {
  testDb
    .prepare(
      `INSERT OR IGNORE INTO daily_challenges
         (date, puzzle_number, song_title, song_artist)
       VALUES (?, ?, 'Test Song', 'Test Artist')`,
    )
    .run(date, puzzleNumber);
}

interface GuessParams {
  date: string;
  userId: string;
  sessionId?: string;
  attemptNumber: number;
  timeMs: number | null;
  correct?: boolean;
}

/** Insert a daily_guesses row for the given user. */
function seedGuess(params: GuessParams): void {
  const { date, userId, sessionId, attemptNumber, timeMs, correct = false } = params;
  const sid = sessionId ?? freshSession();

  testDb
    .prepare(
      `INSERT INTO daily_guesses
         (date, user_id, session_id, guess_text, correct, attempt_number, time_ms, created_at)
       VALUES (?, ?, ?, 'some guess', ?, ?, ?, datetime('now'))`,
    )
    .run(date, userId, sid, correct ? 1 : 0, attemptNumber, timeMs);
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
// getUserStats
// ===========================================================================

describe('getUserStats', () => {
  it('returns null for a non-existent user id', async () => {
    expect(await getUserStats('ghost-user-id')).toBeNull();
  });

  it('returns userId and nickname', async () => {
    const userId = freshUserId();
    seedUser({ id: userId, nickname: 'StatsUser' });

    const stats = await getUserStats(userId);

    expect(stats).not.toBeNull();
    expect(stats!.userId).toBe(userId);
    expect(stats!.nickname).toBe('StatsUser');
  });

  it('returns gamesPlayed and gamesWon from the users table', async () => {
    const userId = freshUserId();
    seedUser({ id: userId, gamesPlayed: 10, gamesWon: 7 });

    const stats = await getUserStats(userId);

    expect(stats!.gamesPlayed).toBe(10);
    expect(stats!.gamesWon).toBe(7);
  });

  it('calculates winRate as gamesWon / gamesPlayed', async () => {
    const userId = freshUserId();
    seedUser({ id: userId, gamesPlayed: 8, gamesWon: 2 });

    const stats = await getUserStats(userId);

    expect(stats!.winRate).toBeCloseTo(2 / 8, 5);
  });

  it('winRate is 0 when gamesPlayed is 0', async () => {
    const userId = freshUserId();
    seedUser({ id: userId, gamesPlayed: 0, gamesWon: 0 });

    const stats = await getUserStats(userId);

    expect(stats!.winRate).toBe(0);
  });

  it('winRate is 1 when gamesPlayed equals gamesWon', async () => {
    const userId = freshUserId();
    seedUser({ id: userId, gamesPlayed: 5, gamesWon: 5 });

    const stats = await getUserStats(userId);

    expect(stats!.winRate).toBe(1);
  });

  it('winRate is a fraction between 0 and 1', async () => {
    const userId = freshUserId();
    seedUser({ id: userId, gamesPlayed: 3, gamesWon: 1 });

    const stats = await getUserStats(userId);

    expect(stats!.winRate).toBeGreaterThan(0);
    expect(stats!.winRate).toBeLessThan(1);
  });

  it('returns currentStreak and bestStreak from the users table', async () => {
    const userId = freshUserId();
    seedUser({ id: userId, currentStreak: 4, bestStreak: 12 });

    const stats = await getUserStats(userId);

    expect(stats!.currentStreak).toBe(4);
    expect(stats!.bestStreak).toBe(12);
  });

  it('avgTimeSeconds is null when no correct guesses', async () => {
    const userId = freshUserId();
    seedUser({ id: userId });

    const stats = await getUserStats(userId);

    expect(stats!.avgTimeSeconds).toBeNull();
  });

  it('avgTimeSeconds is the average of time_ms for correct guesses only', async () => {
    const userId = freshUserId();
    seedUser({ id: userId });
    seedDailyChallenge('2026-04-01', 1);
    seedDailyChallenge('2026-04-02', 2);

    // Correct: 10 seconds
    seedGuess({
      date: '2026-04-01',
      userId,
      attemptNumber: 1,
      timeMs: 10000,
      correct: true,
    });

    // Wrong: should not affect average
    seedGuess({
      date: '2026-04-02',
      userId,
      attemptNumber: 1,
      timeMs: 5000,
      correct: false,
    });

    const stats = await getUserStats(userId);

    expect(stats!.avgTimeSeconds).toBe(10);
  });

  it('avgTimeSeconds ignores rows where time_ms is null', async () => {
    const userId = freshUserId();
    seedUser({ id: userId });
    seedDailyChallenge('2026-04-10', 10);
    seedDailyChallenge('2026-04-11', 11);

    seedGuess({
      date: '2026-04-10',
      userId,
      attemptNumber: 1,
      timeMs: 20000,
      correct: true,
    });

    seedGuess({
      date: '2026-04-11',
      userId,
      attemptNumber: 1,
      timeMs: null,
      correct: true,
    });

    const stats = await getUserStats(userId);

    // Only the 20s row should be included in the average
    expect(stats!.avgTimeSeconds).toBe(20);
  });

  it('avgTimeSeconds averages multiple correct guesses', async () => {
    const userId = freshUserId();
    seedUser({ id: userId });
    seedDailyChallenge('2026-04-20', 20);
    seedDailyChallenge('2026-04-21', 21);
    seedDailyChallenge('2026-04-22', 22);

    seedGuess({
      date: '2026-04-20',
      userId,
      attemptNumber: 1,
      timeMs: 10000,
      correct: true,
    });

    seedGuess({
      date: '2026-04-21',
      userId,
      attemptNumber: 2,
      timeMs: 20000,
      correct: true,
    });

    seedGuess({
      date: '2026-04-22',
      userId,
      attemptNumber: 3,
      timeMs: 30000,
      correct: true,
    });

    const stats = await getUserStats(userId);

    // Average of 10s, 20s, 30s = 20s
    expect(stats!.avgTimeSeconds).toBe(20);
  });

  it('avgTimeSeconds excludes other users guesses', async () => {
    const userId = freshUserId();
    const otherUserId = freshUserId();
    seedUser({ id: userId });
    seedUser({ id: otherUserId });
    seedDailyChallenge('2026-04-25', 25);

    seedGuess({
      date: '2026-04-25',
      userId,
      attemptNumber: 1,
      timeMs: 5000,
      correct: true,
    });

    seedGuess({
      date: '2026-04-25',
      userId: otherUserId,
      attemptNumber: 1,
      timeMs: 999999,
      correct: true,
    });

    const stats = await getUserStats(userId);

    expect(stats!.avgTimeSeconds).toBe(5);
  });

  it('recentGames is empty when user has no guesses', async () => {
    const userId = freshUserId();
    seedUser({ id: userId });

    const stats = await getUserStats(userId);

    expect(stats!.recentGames).toEqual([]);
  });

  it('recentGames includes the correct date for a game', async () => {
    const userId = freshUserId();
    seedUser({ id: userId });
    seedDailyChallenge('2026-04-30', 30);

    seedGuess({
      date: '2026-04-30',
      userId,
      attemptNumber: 1,
      timeMs: 1000,
      correct: true,
    });

    const stats = await getUserStats(userId);

    expect(stats!.recentGames.length).toBe(1);
    expect(stats!.recentGames[0]!.date).toBe('2026-04-30');
  });

  it('recentGames includes puzzleNumber from daily_challenges', async () => {
    const userId = freshUserId();
    seedUser({ id: userId });
    seedDailyChallenge('2026-05-01', 42);

    seedGuess({
      date: '2026-05-01',
      userId,
      attemptNumber: 1,
      timeMs: 1000,
      correct: true,
    });

    const stats = await getUserStats(userId);

    expect(stats!.recentGames[0]!.puzzleNumber).toBe(42);
  });

  it('recentGames correct is true for a winning game', async () => {
    const userId = freshUserId();
    seedUser({ id: userId });
    seedDailyChallenge('2026-05-02', 1);

    seedGuess({
      date: '2026-05-02',
      userId,
      attemptNumber: 3,
      timeMs: 15000,
      correct: true,
    });

    const stats = await getUserStats(userId);

    expect(stats!.recentGames[0]!.correct).toBe(true);
    expect(stats!.recentGames[0]!.attemptsUsed).toBe(3);
  });

  it('recentGames correct is false for a losing game', async () => {
    const userId = freshUserId();
    seedUser({ id: userId });
    seedDailyChallenge('2026-05-03', 1);

    // Six wrong guesses → loss
    for (let i = 1; i <= 6; i++) {
      seedGuess({
        date: '2026-05-03',
        userId,
        attemptNumber: i,
        timeMs: i * 1000,
        correct: false,
      });
    }

    const stats = await getUserStats(userId);

    expect(stats!.recentGames[0]!.correct).toBe(false);
    expect(stats!.recentGames[0]!.attemptsUsed).toBe(6);
  });

  it('recentGames timeTakenSeconds is derived from the correct guess row', async () => {
    const userId = freshUserId();
    seedUser({ id: userId });
    seedDailyChallenge('2026-05-04', 1);

    seedGuess({
      date: '2026-05-04',
      userId,
      attemptNumber: 2,
      timeMs: 12345,
      correct: true,
    });

    const stats = await getUserStats(userId);

    expect(stats!.recentGames[0]!.timeTakenSeconds).toBe(12);
  });

  it('recentGames timeTakenSeconds is null for a losing game', async () => {
    const userId = freshUserId();
    seedUser({ id: userId });
    seedDailyChallenge('2026-05-05', 1);

    for (let i = 1; i <= 6; i++) {
      seedGuess({
        date: '2026-05-05',
        userId,
        attemptNumber: i,
        timeMs: i * 1000,
        correct: false,
      });
    }

    const stats = await getUserStats(userId);

    expect(stats!.recentGames[0]!.timeTakenSeconds).toBeNull();
  });

  it('recentGames is ordered by date DESC', async () => {
    const userId = freshUserId();
    seedUser({ id: userId });
    seedDailyChallenge('2026-05-10', 10);
    seedDailyChallenge('2026-05-11', 11);
    seedDailyChallenge('2026-05-12', 12);

    seedGuess({
      date: '2026-05-10',
      userId,
      attemptNumber: 1,
      timeMs: 1000,
      correct: true,
    });

    seedGuess({
      date: '2026-05-11',
      userId,
      attemptNumber: 1,
      timeMs: 1000,
      correct: true,
    });

    seedGuess({
      date: '2026-05-12',
      userId,
      attemptNumber: 1,
      timeMs: 1000,
      correct: true,
    });

    const stats = await getUserStats(userId);

    expect(stats!.recentGames.length).toBe(3);
    expect(stats!.recentGames[0]!.date).toBe('2026-05-12');
    expect(stats!.recentGames[1]!.date).toBe('2026-05-11');
    expect(stats!.recentGames[2]!.date).toBe('2026-05-10');
  });

  it('recentGames is capped at 10 entries', async () => {
    const userId = freshUserId();
    seedUser({ id: userId });

    for (let i = 1; i <= 15; i++) {
      const date = `2026-06-${String(i).padStart(2, '0')}`;
      seedDailyChallenge(date, i);
      seedGuess({
        date,
        userId,
        attemptNumber: 1,
        timeMs: 1000,
        correct: true,
      });
    }

    const stats = await getUserStats(userId);

    expect(stats!.recentGames.length).toBe(10);
    // Most recent should be June 15
    expect(stats!.recentGames[0]!.date).toBe('2026-06-15');
  });

  it('recentGames only includes the specified users games', async () => {
    const userId = freshUserId();
    const otherUserId = freshUserId();
    seedUser({ id: userId });
    seedUser({ id: otherUserId });
    seedDailyChallenge('2026-06-20', 20);

    seedGuess({
      date: '2026-06-20',
      userId,
      attemptNumber: 1,
      timeMs: 1000,
      correct: true,
    });

    seedGuess({
      date: '2026-06-20',
      userId: otherUserId,
      attemptNumber: 1,
      timeMs: 999999,
      correct: true,
    });

    const stats = await getUserStats(userId);

    expect(stats!.recentGames.length).toBe(1);
    expect(stats!.recentGames[0]!.timeTakenSeconds).toBe(1);
  });
});
