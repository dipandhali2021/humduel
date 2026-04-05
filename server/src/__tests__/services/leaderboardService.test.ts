/**
 * Unit tests for leaderboardService.ts
 *
 * Mocking strategy:
 *   An in-memory SQLite database is created inside vi.hoisted() with the full
 *   schema applied.  The database singleton is replaced before the service is
 *   imported so all prepared statements bind to the in-memory instance.
 *
 *   Data is seeded directly via SQL helpers so each test controls the exact
 *   state of daily_challenges, daily_guesses, and users tables.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// vi.hoisted() — create the in-memory database before mocks run
// ---------------------------------------------------------------------------

const { testDb } = vi.hoisted(() => {
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

  return { testDb: db };
});

// ---------------------------------------------------------------------------
// Replace the database singleton
// ---------------------------------------------------------------------------

vi.mock('../../database.js', () => ({ default: testDb }));

// ---------------------------------------------------------------------------
// Import service under test after mocks are registered
// ---------------------------------------------------------------------------

const { getLeaderboard, getPlayerRank } = await import('../../services/leaderboardService.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let sessionCounter = 0;
function freshSession(): string {
  return `lb-session-${++sessionCounter}`;
}

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
  it('returns empty entries array when no one has played', () => {
    seedDailyChallenge('2026-04-01');
    const result = getLeaderboard('2026-04-01');
    expect(result.entries).toEqual([]);
    expect(result.date).toBe('2026-04-01');
  });

  it('returns puzzleNumber of 0 when no daily_challenges row exists', () => {
    const result = getLeaderboard('2099-12-31');
    expect(result.puzzleNumber).toBe(0);
  });

  it('returns correct puzzleNumber from the daily_challenges row', () => {
    seedDailyChallenge('2026-04-02', 7);
    const result = getLeaderboard('2026-04-02');
    expect(result.puzzleNumber).toBe(7);
  });

  it('does not include sessions that only have wrong guesses', () => {
    const date = '2026-04-03';
    seedDailyChallenge(date);
    const session = freshSession();

    seedGuess({ date, sessionId: session, attemptNumber: 1, timeMs: 5000, correct: false });
    seedGuess({ date, sessionId: session, attemptNumber: 2, timeMs: 10000, correct: false });

    const result = getLeaderboard(date);
    expect(result.entries).toHaveLength(0);
  });

  it('includes a session that has a correct guess', () => {
    const date = '2026-04-04';
    seedDailyChallenge(date);
    const session = freshSession();

    seedGuess({ date, sessionId: session, attemptNumber: 1, timeMs: 8000, correct: true });

    const result = getLeaderboard(date);
    expect(result.entries).toHaveLength(1);
  });

  it('assigns rank 1 to the only entry', () => {
    const date = '2026-04-05';
    seedDailyChallenge(date);
    const session = freshSession();

    seedGuess({ date, sessionId: session, attemptNumber: 2, timeMs: 15000, correct: true });

    const result = getLeaderboard(date);
    expect(result.entries[0].rank).toBe(1);
  });

  it('ranks by fewest attempts ascending', () => {
    const date = '2026-04-06';
    seedDailyChallenge(date);
    const sessA = freshSession();
    const sessB = freshSession();

    seedGuess({ date, sessionId: sessA, attemptNumber: 3, timeMs: 5000, correct: true });
    seedGuess({ date, sessionId: sessB, attemptNumber: 1, timeMs: 5000, correct: true });

    const result = getLeaderboard(date);
    expect(result.entries[0].attemptsUsed).toBe(1);
    expect(result.entries[0].rank).toBe(1);
    expect(result.entries[1].attemptsUsed).toBe(3);
    expect(result.entries[1].rank).toBe(2);
  });

  it('breaks attempt ties by fastest time ascending', () => {
    const date = '2026-04-07';
    seedDailyChallenge(date);
    const sessA = freshSession();
    const sessB = freshSession();

    // Both solved on attempt 2, but sessB was faster
    seedGuess({ date, sessionId: sessA, attemptNumber: 2, timeMs: 20000, correct: true });
    seedGuess({ date, sessionId: sessB, attemptNumber: 2, timeMs: 5000, correct: true });

    const result = getLeaderboard(date);
    expect(result.entries[0].timeTakenSeconds).toBe(5);
    expect(result.entries[0].rank).toBe(1);
    expect(result.entries[1].timeTakenSeconds).toBe(20);
    expect(result.entries[1].rank).toBe(2);
  });

  it('assigns the same rank to entries with equal attempts and time (dense rank)', () => {
    const date = '2026-04-08';
    seedDailyChallenge(date);
    const sessA = freshSession();
    const sessB = freshSession();
    const sessC = freshSession();

    // sessA and sessB are tied
    seedGuess({ date, sessionId: sessA, attemptNumber: 1, timeMs: 10000, correct: true });
    seedGuess({ date, sessionId: sessB, attemptNumber: 1, timeMs: 10000, correct: true });
    // sessC is behind both
    seedGuess({ date, sessionId: sessC, attemptNumber: 2, timeMs: 10000, correct: true });

    const result = getLeaderboard(date);
    expect(result.entries).toHaveLength(3);

    // Both tied entries should be rank 1
    const rankOnes = result.entries.filter((e) => e.rank === 1);
    expect(rankOnes).toHaveLength(2);

    // sessC should be rank 2 (dense rank — no skipped rank)
    const rankTwo = result.entries.find((e) => e.rank === 2);
    expect(rankTwo).toBeDefined();
    expect(rankTwo!.attemptsUsed).toBe(2);
  });

  it('resolves nickname as Anonymous when user_id is null', () => {
    const date = '2026-04-09';
    seedDailyChallenge(date);
    const session = freshSession();

    seedGuess({ date, sessionId: session, userId: null, attemptNumber: 1, timeMs: 5000, correct: true });

    const result = getLeaderboard(date);
    expect(result.entries[0].nickname).toBe('Anonymous');
    expect(result.entries[0].userId).toBeNull();
  });

  it('resolves nickname from users table when user_id is set', () => {
    const date = '2026-04-10';
    seedDailyChallenge(date);
    const userId = freshUserId();
    const session = freshSession();

    seedUser(userId, 'HumPlayer');
    seedGuess({ date, sessionId: session, userId, attemptNumber: 1, timeMs: 3000, correct: true });

    const result = getLeaderboard(date);
    expect(result.entries[0].nickname).toBe('HumPlayer');
    expect(result.entries[0].userId).toBe(userId);
  });

  it('converts time_ms to timeTakenSeconds correctly (rounded)', () => {
    const date = '2026-04-11';
    seedDailyChallenge(date);
    const session = freshSession();

    seedGuess({ date, sessionId: session, attemptNumber: 1, timeMs: 7500, correct: true });

    const result = getLeaderboard(date);
    expect(result.entries[0].timeTakenSeconds).toBe(8); // Math.round(7500/1000)
  });

  it('returns entries only for the given date', () => {
    seedDailyChallenge('2026-04-12');
    seedDailyChallenge('2026-04-13');

    const sessA = freshSession();
    const sessB = freshSession();

    seedGuess({ date: '2026-04-12', sessionId: sessA, attemptNumber: 1, timeMs: 5000, correct: true });
    seedGuess({ date: '2026-04-13', sessionId: sessB, attemptNumber: 1, timeMs: 5000, correct: true });

    const result12 = getLeaderboard('2026-04-12');
    const result13 = getLeaderboard('2026-04-13');

    expect(result12.entries).toHaveLength(1);
    expect(result13.entries).toHaveLength(1);
  });
});

// ===========================================================================
// getPlayerRank
// ===========================================================================

describe('getPlayerRank', () => {
  it('returns null when the session has no guesses at all', () => {
    expect(getPlayerRank('2026-04-20', 'no-such-session')).toBeNull();
  });

  it('returns null when the session only has wrong guesses', () => {
    const date = '2026-04-21';
    seedDailyChallenge(date);
    const session = freshSession();

    seedGuess({ date, sessionId: session, attemptNumber: 1, timeMs: 5000, correct: false });
    seedGuess({ date, sessionId: session, attemptNumber: 2, timeMs: 10000, correct: false });

    expect(getPlayerRank(date, session)).toBeNull();
  });

  it('returns 1 when the session is the only one with a correct guess', () => {
    const date = '2026-04-22';
    seedDailyChallenge(date);
    const session = freshSession();

    seedGuess({ date, sessionId: session, attemptNumber: 1, timeMs: 8000, correct: true });

    expect(getPlayerRank(date, session)).toBe(1);
  });

  it('returns 2 when exactly one session has a better score', () => {
    const date = '2026-04-23';
    seedDailyChallenge(date);
    const sessA = freshSession();
    const sessB = freshSession();

    // sessA solves in 1 attempt — better
    seedGuess({ date, sessionId: sessA, attemptNumber: 1, timeMs: 5000, correct: true });
    // sessB solves in 2 attempts — worse
    seedGuess({ date, sessionId: sessB, attemptNumber: 2, timeMs: 5000, correct: true });

    expect(getPlayerRank(date, sessB)).toBe(2);
  });

  it('returns 1 when the session is tied for first with another session', () => {
    const date = '2026-04-24';
    seedDailyChallenge(date);
    const sessA = freshSession();
    const sessB = freshSession();

    // Both solved on attempt 1 with the same time
    seedGuess({ date, sessionId: sessA, attemptNumber: 1, timeMs: 10000, correct: true });
    seedGuess({ date, sessionId: sessB, attemptNumber: 1, timeMs: 10000, correct: true });

    // Neither has a strictly better score, so both rank 1
    expect(getPlayerRank(date, sessA)).toBe(1);
    expect(getPlayerRank(date, sessB)).toBe(1);
  });

  it('returns 1 when the session has the fastest time at the same attempt count', () => {
    const date = '2026-04-25';
    seedDailyChallenge(date);
    const sessA = freshSession();
    const sessB = freshSession();

    seedGuess({ date, sessionId: sessA, attemptNumber: 1, timeMs: 3000, correct: true });
    seedGuess({ date, sessionId: sessB, attemptNumber: 1, timeMs: 12000, correct: true });

    expect(getPlayerRank(date, sessA)).toBe(1);
    expect(getPlayerRank(date, sessB)).toBe(2);
  });

  it('returns correct rank for 3rd place among 4 sessions', () => {
    const date = '2026-04-26';
    seedDailyChallenge(date);

    const sessions = [freshSession(), freshSession(), freshSession(), freshSession()];

    // Attempt 1, various times — best to worst
    seedGuess({ date, sessionId: sessions[0], attemptNumber: 1, timeMs: 1000, correct: true });
    seedGuess({ date, sessionId: sessions[1], attemptNumber: 1, timeMs: 5000, correct: true });
    seedGuess({ date, sessionId: sessions[2], attemptNumber: 1, timeMs: 9000, correct: true });
    seedGuess({ date, sessionId: sessions[3], attemptNumber: 1, timeMs: 15000, correct: true });

    expect(getPlayerRank(date, sessions[2])).toBe(3);
  });
});
