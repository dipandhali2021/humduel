/**
 * Unit tests for dailyService.ts
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

vi.mock('../../config.js', () => ({
  DAILY_EPOCH: '2026-04-01',
  DATABASE_PATH: ':memory:',
}));

// ---------------------------------------------------------------------------
// Import service under test after mocks are registered
// ---------------------------------------------------------------------------

const {
  getTodayDate,
  getPuzzleNumber,
  selectSongForDate,
  ensureDailyChallenge,
  getDailyChallenge,
  submitDailyGuess,
  getDailyResult,
} = await import('../../services/dailyService.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let sessionCounter = 0;
function freshSession(): string {
  return `test-session-${++sessionCounter}`;
}

// ---------------------------------------------------------------------------
// Cleanup between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  testDb.exec('DELETE FROM daily_guesses');
  testDb.exec('DELETE FROM daily_challenges');
});

// ===========================================================================
// getTodayDate
// ===========================================================================

describe('getTodayDate', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const result = getTodayDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returned date is parseable as a valid Date', () => {
    const result = getTodayDate();
    const parsed = new Date(result);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
  });

  it('returns the current UTC date', () => {
    const result = getTodayDate();
    const expected = new Date().toISOString().slice(0, 10);
    expect(result).toBe(expected);
  });
});

// ===========================================================================
// getPuzzleNumber
// ===========================================================================

describe('getPuzzleNumber', () => {
  it('returns 1 for the DAILY_EPOCH date', () => {
    expect(getPuzzleNumber('2026-04-01')).toBe(1);
  });

  it('returns 2 for the day after DAILY_EPOCH', () => {
    expect(getPuzzleNumber('2026-04-02')).toBe(2);
  });

  it('returns 8 for seven days after DAILY_EPOCH', () => {
    expect(getPuzzleNumber('2026-04-08')).toBe(8);
  });

  it('returns the correct number for an arbitrary future date', () => {
    // 2026-04-01 is day 1; 2026-05-01 is 30 days later → puzzle #31
    expect(getPuzzleNumber('2026-05-01')).toBe(31);
  });

  it('returns 366 for a full year after epoch (2027-04-01)', () => {
    expect(getPuzzleNumber('2027-04-01')).toBe(366);
  });
});

// ===========================================================================
// selectSongForDate
// ===========================================================================

describe('selectSongForDate', () => {
  it('returns an object with title and artist strings', () => {
    const song = selectSongForDate('2026-04-01');
    expect(typeof song.title).toBe('string');
    expect(typeof song.artist).toBe('string');
    expect(song.title.length).toBeGreaterThan(0);
    expect(song.artist.length).toBeGreaterThan(0);
  });

  it('is deterministic — same date always produces the same song', () => {
    const a = selectSongForDate('2026-04-05');
    const b = selectSongForDate('2026-04-05');
    expect(a.title).toBe(b.title);
    expect(a.artist).toBe(b.artist);
  });

  it('produces different songs for different dates', () => {
    const dates = ['2026-04-01', '2026-04-02', '2026-04-15', '2026-05-10', '2026-12-25'];
    const songs = dates.map((d) => selectSongForDate(d));
    const titles = songs.map((s) => s.title);
    // At least some titles must differ across the set of dates
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBeGreaterThan(1);
  });

  it('returns a song that is part of the known catalog (non-empty title)', () => {
    for (const date of ['2026-04-03', '2026-06-15', '2026-09-20']) {
      const song = selectSongForDate(date);
      expect(song.title.length).toBeGreaterThan(0);
      expect(song.artist.length).toBeGreaterThan(0);
    }
  });
});

// ===========================================================================
// ensureDailyChallenge
// ===========================================================================

describe('ensureDailyChallenge', () => {
  it('creates a new row when none exists for the date', async () => {
    const row = await ensureDailyChallenge('2026-04-10');
    expect(row).toBeDefined();
    expect(row.date).toBe('2026-04-10');
  });

  it('stores the correct puzzle_number', async () => {
    const row = await ensureDailyChallenge('2026-04-10');
    // April 10 is 9 days after April 1, so puzzle #10
    expect(row.puzzle_number).toBe(10);
  });

  it('stores non-empty song_title and song_artist', async () => {
    const row = await ensureDailyChallenge('2026-04-15');
    expect(typeof row.song_title).toBe('string');
    expect(row.song_title.length).toBeGreaterThan(0);
    expect(typeof row.song_artist).toBe('string');
    expect(row.song_artist.length).toBeGreaterThan(0);
  });

  it('returns the existing row without creating a duplicate on second call', async () => {
    const first = await ensureDailyChallenge('2026-04-20');
    const second = await ensureDailyChallenge('2026-04-20');
    expect(second.id).toBe(first.id);
    expect(second.song_title).toBe(first.song_title);

    const count = testDb
      .prepare('SELECT COUNT(*) AS cnt FROM daily_challenges WHERE date = ?')
      .get('2026-04-20') as { cnt: number };
    expect(count.cnt).toBe(1);
  });

  it('persists the selected song (title/artist) to the database', async () => {
    await ensureDailyChallenge('2026-04-25');
    const row = testDb
      .prepare('SELECT * FROM daily_challenges WHERE date = ?')
      .get('2026-04-25') as { song_title: string; song_artist: string } | undefined;

    expect(row).toBeDefined();
    expect(typeof row!.song_title).toBe('string');
    expect(row!.song_title.length).toBeGreaterThan(0);
    expect(typeof row!.song_artist).toBe('string');
    expect(row!.song_artist.length).toBeGreaterThan(0);
  });

  it('stores null for song_id, spotify_preview_url, spotify_album_art when not provided', async () => {
    const row = await ensureDailyChallenge('2026-04-26');
    expect(row.song_id).toBeNull();
    expect(row.spotify_preview_url).toBeNull();
    expect(row.spotify_album_art).toBeNull();
  });
});

// ===========================================================================
// getDailyChallenge
// ===========================================================================

describe('getDailyChallenge', () => {
  it('returns a challenge for a date with no guesses', async () => {
    const session = freshSession();
    const result = await getDailyChallenge('2026-04-10', session);

    expect(result.date).toBe('2026-04-10');
    expect(result.puzzleNumber).toBe(10);
    expect(result.maxAttempts).toBe(6);
    expect(result.attemptsUsed).toBe(0);
    expect(result.completed).toBe(false);
    expect(result.won).toBeNull();
  });

  it('increments attemptsUsed after each guess', async () => {
    const session = freshSession();
    await submitDailyGuess('2026-04-12', 'Wrong guess 1', session);

    const result = await getDailyChallenge('2026-04-12', session);
    expect(result.attemptsUsed).toBe(1);
  });

  it('sets completed to true after a correct guess', async () => {
    const session = freshSession();
    // Get the correct song for this date
    const challenge = await ensureDailyChallenge('2026-04-13');
    await submitDailyGuess('2026-04-13', challenge.song_title, session);

    const result = await getDailyChallenge('2026-04-13', session);
    expect(result.completed).toBe(true);
    expect(result.won).toBe(true);
  });

  it('sets completed to true and won to false after exhausting all guesses', async () => {
    const session = freshSession();
    for (let i = 1; i <= 6; i++) {
      await submitDailyGuess('2026-04-14', `Wrong ${i}`, session);
    }

    const result = await getDailyChallenge('2026-04-14', session);
    expect(result.completed).toBe(true);
    expect(result.won).toBe(false);
  });

  it('maintains independent state for different sessions', async () => {
    const sessionA = freshSession();
    const sessionB = freshSession();
    await submitDailyGuess('2026-04-15', 'Wrong', sessionA);

    const resultA = await getDailyChallenge('2026-04-15', sessionA);
    const resultB = await getDailyChallenge('2026-04-15', sessionB);

    expect(resultA.attemptsUsed).toBe(1);
    expect(resultB.attemptsUsed).toBe(0);
  });
});

// ===========================================================================
// submitDailyGuess – correct guesses
// ===========================================================================

describe('submitDailyGuess – correct guesses', () => {
  it('returns correct: true when the title matches exactly', async () => {
    const session = freshSession();
    const challenge = await ensureDailyChallenge('2026-04-20');
    const result = await submitDailyGuess('2026-04-20', challenge.song_title, session);

    expect(result.correct).toBe(true);
  });

  it('returns correct: true for a case-insensitive match', async () => {
    const session = freshSession();
    const challenge = await ensureDailyChallenge('2026-04-21');
    const result = await submitDailyGuess(
      '2026-04-21',
      challenge.song_title.toUpperCase(),
      session,
    );

    expect(result.correct).toBe(true);
  });

  it('reveals song data when the guess is correct', async () => {
    const session = freshSession();
    const challenge = await ensureDailyChallenge('2026-04-22');
    const result = await submitDailyGuess('2026-04-22', challenge.song_title, session);

    expect(result.song).toBeDefined();
    expect(result.song!.title).toBe(challenge.song_title);
    expect(result.song!.artist).toBe(challenge.song_artist);
  });

  it('sets attemptsUsed to 1 for a correct guess on the first attempt', async () => {
    const session = freshSession();
    const challenge = await ensureDailyChallenge('2026-04-23');
    const result = await submitDailyGuess('2026-04-23', challenge.song_title, session);

    expect(result.attemptsUsed).toBe(1);
    expect(result.attemptsRemaining).toBe(5);
    expect(result.maxAttempts).toBe(6);
  });
});

// ===========================================================================
// submitDailyGuess – wrong guesses
// ===========================================================================

describe('submitDailyGuess – wrong guesses', () => {
  it('returns correct: false for a wrong guess', async () => {
    const session = freshSession();
    const result = await submitDailyGuess('2026-04-30', 'Not The Song', session);

    expect(result.correct).toBe(false);
  });

  it('does NOT reveal the song on the first wrong guess', async () => {
    const session = freshSession();
    const result = await submitDailyGuess('2026-05-01', 'Wrong Guess', session);

    expect(result.song).toBeUndefined();
  });

  it('increments attemptsUsed on each wrong guess', async () => {
    const session = freshSession();
    const r1 = await submitDailyGuess('2026-05-02', 'Wrong 1', session);
    const r2 = await submitDailyGuess('2026-05-02', 'Wrong 2', session);
    const r3 = await submitDailyGuess('2026-05-02', 'Wrong 3', session);

    expect(r1.attemptsUsed).toBe(1);
    expect(r2.attemptsUsed).toBe(2);
    expect(r3.attemptsUsed).toBe(3);
  });

  it('decrements attemptsRemaining on each wrong guess', async () => {
    const session = freshSession();
    const r1 = await submitDailyGuess('2026-05-03', 'Wrong 1', session);
    const r2 = await submitDailyGuess('2026-05-03', 'Wrong 2', session);

    expect(r1.attemptsRemaining).toBe(5);
    expect(r2.attemptsRemaining).toBe(4);
  });

  it('does NOT reveal song until all 6 attempts are used', async () => {
    const session = freshSession();
    for (let i = 1; i <= 5; i++) {
      const r = await submitDailyGuess('2026-05-04', `Wrong ${i}`, session);
      expect(r.song).toBeUndefined();
      expect(r.attemptsRemaining).toBe(6 - i);
    }
  });

  it('reveals song on the 6th (final) wrong guess', async () => {
    const session = freshSession();
    for (let i = 1; i <= 5; i++) {
      await submitDailyGuess('2026-05-05', `Wrong ${i}`, session);
    }

    const r6 = await submitDailyGuess('2026-05-05', 'Wrong 6', session);
    expect(r6.correct).toBe(false);
    expect(r6.attemptsRemaining).toBe(0);
    expect(r6.song).toBeDefined();
  });
});

// ===========================================================================
// submitDailyGuess – attempt limits
// ===========================================================================

describe('submitDailyGuess – attempt limits', () => {
  it('allows exactly 6 attempts before throwing', async () => {
    const session = freshSession();
    for (let i = 1; i <= 6; i++) {
      await expect(
        submitDailyGuess('2026-05-10', `Wrong ${i}`, session),
      ).resolves.not.toThrow();
    }
  });

  it('throws a 409 error on the 7th attempt', async () => {
    const session = freshSession();
    for (let i = 1; i <= 6; i++) {
      await submitDailyGuess('2026-05-11', `Wrong ${i}`, session);
    }

    await expect(
      submitDailyGuess('2026-05-11', 'Wrong 7', session),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws a 409 error if the session already has a correct guess', async () => {
    const session = freshSession();
    const challenge = await ensureDailyChallenge('2026-05-12');
    await submitDailyGuess('2026-05-12', challenge.song_title, session);

    await expect(
      submitDailyGuess('2026-05-12', 'Another guess', session),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('maintains independent attempt counts per session', async () => {
    const sessionA = freshSession();
    const sessionB = freshSession();

    await submitDailyGuess('2026-05-13', 'Wrong A1', sessionA);
    await submitDailyGuess('2026-05-13', 'Wrong A2', sessionA);
    const rA3 = await submitDailyGuess('2026-05-13', 'Wrong A3', sessionA);

    const rB1 = await submitDailyGuess('2026-05-13', 'Wrong B1', sessionB);

    expect(rA3.attemptsUsed).toBe(3);
    expect(rB1.attemptsUsed).toBe(1);
  });
});

// ===========================================================================
// submitDailyGuess – userId tracking
// ===========================================================================

describe('submitDailyGuess – userId tracking', () => {
  it('accepts an optional userId parameter without error', async () => {
    const session = freshSession();
    const result = await submitDailyGuess(
      '2026-05-20',
      'Any guess',
      session,
      'user-123',
    );

    expect(result).toBeDefined();
  });

  it('persists the userId when provided', async () => {
    const session = freshSession();
    await submitDailyGuess('2026-05-21', 'Guess', session, 'user-abc');

    const row = testDb
      .prepare('SELECT user_id FROM daily_guesses WHERE session_id = ?')
      .get(session) as { user_id: string | null } | undefined;

    expect(row).toBeDefined();
    expect(row!.user_id).toBe('user-abc');
  });

  it('allows null userId (anonymous play)', async () => {
    const session = freshSession();
    await submitDailyGuess('2026-05-22', 'Guess', session, undefined);

    const row = testDb
      .prepare('SELECT user_id FROM daily_guesses WHERE session_id = ?')
      .get(session) as { user_id: string | null } | undefined;

    expect(row).toBeDefined();
    expect(row!.user_id).toBeNull();
  });
});

// ===========================================================================
// getDailyResult
// ===========================================================================

describe('getDailyResult', () => {
  it('returns null when no guesses exist for the session', async () => {
    const session = freshSession();
    const result = await getDailyResult('2026-06-01', session);
    expect(result).toBeNull();
  });

  it('returns null when guesses exist but session is not finished', async () => {
    const session = freshSession();
    await submitDailyGuess('2026-06-02', 'Wrong 1', session);

    const result = await getDailyResult('2026-06-02', session);
    expect(result).toBeNull();
  });

  it('returns a complete result for a winning session', async () => {
    const session = freshSession();
    const challenge = await ensureDailyChallenge('2026-06-10');
    await submitDailyGuess('2026-06-10', 'Wrong 1', session);
    await submitDailyGuess('2026-06-10', challenge.song_title, session);

    const result = await getDailyResult('2026-06-10', session);

    expect(result).not.toBeNull();
    expect(result!.date).toBe('2026-06-10');
    expect(result!.correct).toBe(true);
    expect(result!.attemptsUsed).toBe(2);
    expect(result!.maxAttempts).toBe(6);
    expect(result!.song.title).toBe(challenge.song_title);
    expect(result!.song.artist).toBe(challenge.song_artist);
  });

  it('returns a complete result for a losing session (all 6 wrong)', async () => {
    const session = freshSession();
    for (let i = 1; i <= 6; i++) {
      await submitDailyGuess('2026-06-11', `Wrong ${i}`, session);
    }

    const result = await getDailyResult('2026-06-11', session);

    expect(result).not.toBeNull();
    expect(result!.correct).toBe(false);
    expect(result!.attemptsUsed).toBe(6);
  });

  it('shareText contains Wordle-style squares', async () => {
    const session = freshSession();
    const challenge = await ensureDailyChallenge('2026-06-12');
    await submitDailyGuess('2026-06-12', 'Wrong 1', session);
    await submitDailyGuess('2026-06-12', 'Wrong 2', session);
    await submitDailyGuess('2026-06-12', challenge.song_title, session);

    const result = await getDailyResult('2026-06-12', session);

    expect(result!.shareText).toContain('🟥');
    expect(result!.shareText).toContain('🟩');
    expect(result!.shareText).toContain('⬜');
  });

  it('shareText uses X/6 label for a losing session', async () => {
    const session = freshSession();
    for (let i = 1; i <= 6; i++) {
      await submitDailyGuess('2026-06-13', `Wrong ${i}`, session);
    }

    const result = await getDailyResult('2026-06-13', session);
    expect(result!.shareText).toContain('X/6');
  });

  it('shareText uses n/6 label for a winning session', async () => {
    const session = freshSession();
    const challenge = await ensureDailyChallenge('2026-06-14');
    await submitDailyGuess('2026-06-14', 'Wrong 1', session);
    await submitDailyGuess('2026-06-14', challenge.song_title, session);

    const result = await getDailyResult('2026-06-14', session);
    expect(result!.shareText).toContain('2/6');
  });

  it('shareText contains the puzzle number', async () => {
    const session = freshSession();
    const challenge = await ensureDailyChallenge('2026-06-15');
    await submitDailyGuess('2026-06-15', challenge.song_title, session);

    const result = await getDailyResult('2026-06-15', session);

    // 2026-06-15 is 75 days after 2026-04-01 → puzzle #76 (inclusive)
    expect(result!.puzzleNumber).toBe(76);
    expect(result!.shareText).toContain('#76');
  });

  it('all 6 squares are red for a full losing session', async () => {
    const session = freshSession();
    for (let i = 1; i <= 6; i++) {
      await submitDailyGuess('2026-06-16', `Wrong ${i}`, session);
    }

    const result = await getDailyResult('2026-06-16', session);

    const redCount = (result!.shareText.match(/🟥/g) ?? []).length;
    expect(redCount).toBe(6);
    expect(result!.shareText).not.toContain('🟩');
  });

  it('first square is green when solved on attempt 1', async () => {
    const session = freshSession();
    const challenge = await ensureDailyChallenge('2026-06-17');
    await submitDailyGuess('2026-06-17', challenge.song_title, session);

    const result = await getDailyResult('2026-06-17', session);

    const greenCount = (result!.shareText.match(/🟩/g) ?? []).length;
    const emptyCount = (result!.shareText.match(/⬜/g) ?? []).length;
    expect(greenCount).toBe(1);
    expect(emptyCount).toBe(5);
  });
});
