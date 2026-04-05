/**
 * Unit tests for statsService.ts
 *
 * Mocking strategy:
 *   An in-memory SQLite database is created inside vi.hoisted() with the full
 *   schema applied.  The database singleton is replaced before the service is
 *   imported so all prepared statements bind to the in-memory instance.
 *
 *   Data is seeded directly via SQL helpers to control the exact state of the
 *   users and daily_guesses tables.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// vi.hoisted() — create the in-memory database before mocks run
// ---------------------------------------------------------------------------

const { testDb } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3') as typeof import('better-sqlite3').default;
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
  it('returns null for a non-existent user id', () => {
    expect(getUserStats('ghost-user-id')).toBeNull();
  });

  it('returns a result with the correct userId and nickname', () => {
    const id = freshUserId();
    seedUser({ id, nickname: 'HumPlayer' });

    const stats = getUserStats(id);
    expect(stats).not.toBeNull();
    expect(stats!.userId).toBe(id);
    expect(stats!.nickname).toBe('HumPlayer');
  });

  it('returns gamesPlayed and gamesWon from the users row', () => {
    const id = freshUserId();
    seedUser({ id, gamesPlayed: 10, gamesWon: 7 });

    const stats = getUserStats(id);
    expect(stats!.gamesPlayed).toBe(10);
    expect(stats!.gamesWon).toBe(7);
  });

  it('computes winRate as gamesWon / gamesPlayed', () => {
    const id = freshUserId();
    seedUser({ id, gamesPlayed: 10, gamesWon: 7 });

    const stats = getUserStats(id);
    expect(stats!.winRate).toBeCloseTo(0.7);
  });

  it('returns winRate of 0 when gamesPlayed is 0', () => {
    const id = freshUserId();
    seedUser({ id, gamesPlayed: 0, gamesWon: 0 });

    const stats = getUserStats(id);
    expect(stats!.winRate).toBe(0);
  });

  it('returns winRate of 1 when all games were won', () => {
    const id = freshUserId();
    seedUser({ id, gamesPlayed: 5, gamesWon: 5 });

    const stats = getUserStats(id);
    expect(stats!.winRate).toBe(1);
  });

  it('returns currentStreak and bestStreak from the users row', () => {
    const id = freshUserId();
    seedUser({ id, currentStreak: 3, bestStreak: 7 });

    const stats = getUserStats(id);
    expect(stats!.currentStreak).toBe(3);
    expect(stats!.bestStreak).toBe(7);
  });

  it('returns avgTimeSeconds as null when there are no correct daily guesses', () => {
    const id = freshUserId();
    seedUser({ id });

    const stats = getUserStats(id);
    expect(stats!.avgTimeSeconds).toBeNull();
  });

  it('computes avgTimeSeconds from correct guesses only', () => {
    const id = freshUserId();
    seedUser({ id, gamesPlayed: 2, gamesWon: 2 });

    seedGuess({ date: '2026-04-01', userId: id, attemptNumber: 1, timeMs: 10000, correct: true });
    seedGuess({ date: '2026-04-02', userId: id, attemptNumber: 1, timeMs: 20000, correct: true });

    const stats = getUserStats(id);
    // avg of 10000ms and 20000ms = 15000ms = 15s
    expect(stats!.avgTimeSeconds).toBe(15);
  });

  it('excludes wrong guesses from avgTimeSeconds', () => {
    const id = freshUserId();
    seedUser({ id, gamesPlayed: 1, gamesWon: 1 });

    // Wrong guess with a huge time — should not influence avg
    seedGuess({ date: '2026-04-01', userId: id, attemptNumber: 1, timeMs: 999999, correct: false });
    // Correct guess
    seedGuess({ date: '2026-04-01', userId: id, attemptNumber: 2, timeMs: 8000, correct: true });

    const stats = getUserStats(id);
    expect(stats!.avgTimeSeconds).toBe(8);
  });

  it('excludes rows with null time_ms from avgTimeSeconds', () => {
    const id = freshUserId();
    seedUser({ id });

    seedGuess({ date: '2026-04-01', userId: id, attemptNumber: 1, timeMs: null, correct: true });
    seedGuess({ date: '2026-04-02', userId: id, attemptNumber: 1, timeMs: 6000, correct: true });

    const stats = getUserStats(id);
    // Only the 6000ms row counts
    expect(stats!.avgTimeSeconds).toBe(6);
  });

  it('returns an empty recentGames array when no guesses exist', () => {
    const id = freshUserId();
    seedUser({ id });

    const stats = getUserStats(id);
    expect(stats!.recentGames).toEqual([]);
  });

  it('recentGames includes one entry per date played', () => {
    const id = freshUserId();
    seedUser({ id });

    seedDailyChallenge('2026-04-01', 1);
    seedDailyChallenge('2026-04-02', 2);
    seedGuess({ date: '2026-04-01', userId: id, attemptNumber: 1, timeMs: 5000, correct: true });
    seedGuess({ date: '2026-04-02', userId: id, attemptNumber: 2, timeMs: 10000, correct: false });

    const stats = getUserStats(id);
    expect(stats!.recentGames).toHaveLength(2);
  });

  it('recentGames entries have the correct shape', () => {
    const id = freshUserId();
    seedUser({ id });

    seedDailyChallenge('2026-04-05', 5);
    seedGuess({ date: '2026-04-05', userId: id, attemptNumber: 2, timeMs: 12000, correct: true });

    const stats = getUserStats(id);
    const game = stats!.recentGames[0];

    expect(game.date).toBe('2026-04-05');
    expect(game.puzzleNumber).toBe(5);
    expect(game.correct).toBe(true);
    expect(game.attemptsUsed).toBe(2);
    expect(game.timeTakenSeconds).toBe(12);
  });

  it('recentGames marks correct as false for a lost game', () => {
    const id = freshUserId();
    seedUser({ id });

    seedDailyChallenge('2026-04-06', 6);
    // 6 wrong guesses — all incorrect
    for (let i = 1; i <= 6; i++) {
      seedGuess({ date: '2026-04-06', userId: id, attemptNumber: i, timeMs: i * 1000, correct: false });
    }

    const stats = getUserStats(id);
    const game = stats!.recentGames[0];
    expect(game.correct).toBe(false);
  });

  it('recentGames returns timeTakenSeconds as null for a lost game (no correct guess time)', () => {
    const id = freshUserId();
    seedUser({ id });

    seedDailyChallenge('2026-04-07', 7);
    for (let i = 1; i <= 6; i++) {
      seedGuess({ date: '2026-04-07', userId: id, attemptNumber: i, timeMs: i * 2000, correct: false });
    }

    const stats = getUserStats(id);
    const game = stats!.recentGames[0];
    // Lost game — time is NULL in the CASE expression
    expect(game.timeTakenSeconds).toBeNull();
  });

  it('recentGames uses puzzleNumber of 0 when no daily_challenges row exists', () => {
    const id = freshUserId();
    seedUser({ id });

    // No seedDailyChallenge call for this date
    seedGuess({ date: '2026-04-08', userId: id, attemptNumber: 1, timeMs: 5000, correct: true });

    const stats = getUserStats(id);
    const game = stats!.recentGames[0];
    expect(game.puzzleNumber).toBe(0);
  });

  it('returns at most 10 recentGames', () => {
    const id = freshUserId();
    seedUser({ id });

    for (let day = 1; day <= 15; day++) {
      const date = `2026-04-${String(day).padStart(2, '0')}`;
      seedDailyChallenge(date, day);
      seedGuess({ date, userId: id, attemptNumber: 1, timeMs: 5000, correct: true });
    }

    const stats = getUserStats(id);
    expect(stats!.recentGames.length).toBeLessThanOrEqual(10);
  });

  it('recentGames are ordered most recent first', () => {
    const id = freshUserId();
    seedUser({ id });

    seedDailyChallenge('2026-04-01', 1);
    seedDailyChallenge('2026-04-05', 5);
    seedDailyChallenge('2026-04-10', 10);

    seedGuess({ date: '2026-04-01', userId: id, attemptNumber: 1, timeMs: 5000, correct: true });
    seedGuess({ date: '2026-04-05', userId: id, attemptNumber: 1, timeMs: 5000, correct: true });
    seedGuess({ date: '2026-04-10', userId: id, attemptNumber: 1, timeMs: 5000, correct: true });

    const stats = getUserStats(id);
    const dates = stats!.recentGames.map((g) => g.date);
    expect(dates[0]).toBe('2026-04-10');
    expect(dates[1]).toBe('2026-04-05');
    expect(dates[2]).toBe('2026-04-01');
  });

  it('does not include other users guesses in stats', () => {
    const idA = freshUserId();
    const idB = freshUserId();
    seedUser({ id: idA });
    seedUser({ id: idB });

    seedDailyChallenge('2026-04-01', 1);
    seedGuess({ date: '2026-04-01', userId: idA, attemptNumber: 1, timeMs: 5000, correct: true });
    seedGuess({ date: '2026-04-01', userId: idB, attemptNumber: 1, timeMs: 9000, correct: true });

    const statsA = getUserStats(idA);
    const statsB = getUserStats(idB);

    // Each user should see only their own game
    expect(statsA!.recentGames).toHaveLength(1);
    expect(statsB!.recentGames).toHaveLength(1);

    // avgTimeSeconds should differ
    expect(statsA!.avgTimeSeconds).toBe(5);
    expect(statsB!.avgTimeSeconds).toBe(9);
  });
});
