/**
 * Unit tests for challengeService.ts
 *
 * Mocking strategy:
 *   An in-memory SQLite database with an async wrapper is used.
 *   The getDb() function is mocked to return the async wrapper.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// vi.hoisted() runs before the vi.mock() factory
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

  // Create async wrapper
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
// Import the service after the mock is registered.
// ---------------------------------------------------------------------------

const {
  createChallengeWithId,
  getChallenge,
  submitGuess,
  getResult,
} = await import('../../services/challengeService.js');

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Minimal valid waveform – 200 values in [0, 1]. */
const WAVEFORM = Array.from({ length: 200 }, (_, i) => (i % 10) / 10);

/** A reusable challenge payload. */
function makePayload(overrides: Partial<Parameters<typeof createChallengeWithId>[1]> = {}) {
  return {
    waveformData: WAVEFORM,
    songTitle: 'Bohemian Rhapsody',
    songArtist: 'Queen',
    songId: 'spotify:track:abc123',
    durationSeconds: 30,
    creatorAlias: 'Alice',
    audioFilename: 'test.webm',
    ...overrides,
  };
}

/** Insert a challenge and return its id alongside the returned metadata. */
async function seedChallenge(
  id: string,
  overrides: Partial<Parameters<typeof createChallengeWithId>[1]> = {},
) {
  return createChallengeWithId(id, makePayload(overrides));
}

// ---------------------------------------------------------------------------
// Cleanup between tests — each test operates on a clean database state.
// ---------------------------------------------------------------------------

beforeEach(() => {
  testDb.exec('DELETE FROM guesses');
  testDb.exec('DELETE FROM challenges');
});

// ===========================================================================
// createChallengeWithId
// ===========================================================================

describe('createChallengeWithId', () => {
  it('stores all fields in the database', async () => {
    const id = 'ch000001';
    await seedChallenge(id);

    const row = testDb.prepare('SELECT * FROM challenges WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;

    expect(row).toBeDefined();
    expect(row!['id']).toBe(id);
    expect(row!['song_title']).toBe('Bohemian Rhapsody');
    expect(row!['song_artist']).toBe('Queen');
    expect(row!['creator_name']).toBe('Alice');
    expect(row!['audio_filename']).toBe('test.webm');
    expect(row!['duration_seconds']).toBe(30);
    expect(JSON.parse(row!['waveform_data'] as string)).toEqual(WAVEFORM);
  });

  it('returns the correct CreatedChallenge structure', async () => {
    const id = 'ch000002';
    const result = await seedChallenge(id);

    expect(result).toMatchObject({
      id,
      challengeUrl: `/c/${id}`,
    });
    expect(typeof result.expiresAt).toBe('string');
    expect(typeof result.createdAt).toBe('string');
    expect(Number.isNaN(new Date(result.expiresAt).getTime())).toBe(false);
    expect(Number.isNaN(new Date(result.createdAt).getTime())).toBe(false);
  });

  it('sets expiresAt approximately 7 days after createdAt', async () => {
    const id = 'ch000003';
    const result = await seedChallenge(id);

    const createdMs = new Date(result.createdAt).getTime();
    const expiresMs = new Date(result.expiresAt).getTime();
    const diffDays = (expiresMs - createdMs) / (1000 * 60 * 60 * 24);

    expect(diffDays).toBeGreaterThanOrEqual(6.999);
    expect(diffDays).toBeLessThanOrEqual(7.001);
  });

  it('defaults creatorAlias to "Anonymous" when empty string is provided', async () => {
    const id = 'ch000004';
    await seedChallenge(id, { creatorAlias: '' });

    const row = testDb.prepare('SELECT creator_name FROM challenges WHERE id = ?').get(id) as
      | { creator_name: string }
      | undefined;

    expect(row!['creator_name']).toBe('Anonymous');
  });

  it('defaults creatorAlias to "Anonymous" when undefined is provided', async () => {
    const id = 'ch000005';
    await seedChallenge(id, { creatorAlias: undefined });

    const row = testDb.prepare('SELECT creator_name FROM challenges WHERE id = ?').get(id) as
      | { creator_name: string }
      | undefined;

    expect(row!['creator_name']).toBe('Anonymous');
  });

  it('defaults creatorAlias to "Anonymous" when only whitespace is provided', async () => {
    const id = 'ch000006';
    await seedChallenge(id, { creatorAlias: '   ' });

    const row = testDb.prepare('SELECT creator_name FROM challenges WHERE id = ?').get(id) as
      | { creator_name: string }
      | undefined;

    expect(row!['creator_name']).toBe('Anonymous');
  });

  it('stores the songId correctly (including null)', async () => {
    const idWithSong = 'ch000007';
    const idNoSong = 'ch000008';
    await seedChallenge(idWithSong, { songId: 'spotify:123' });
    await seedChallenge(idNoSong, { songId: undefined });

    const rowWith = testDb.prepare('SELECT song_id FROM challenges WHERE id = ?').get(idWithSong) as
      | { song_id: string | null }
      | undefined;
    const rowWithout = testDb
      .prepare('SELECT song_id FROM challenges WHERE id = ?')
      .get(idNoSong) as { song_id: string | null } | undefined;

    expect(rowWith!['song_id']).toBe('spotify:123');
    expect(rowWithout!['song_id']).toBeNull();
  });
});

// ===========================================================================
// getChallenge
// ===========================================================================

describe('getChallenge', () => {
  it('returns null for a non-existent id', async () => {
    expect(await getChallenge('doesnotexist')).toBeNull();
  });

  it('returns the correct public shape', async () => {
    const id = 'ch010001';
    await seedChallenge(id);

    const pub = await getChallenge(id);

    expect(pub).not.toBeNull();
    expect(pub!.id).toBe(id);
    expect(pub!.creatorAlias).toBe('Alice');
    expect(pub!.durationSeconds).toBe(30);
    expect(pub!.waveformData).toEqual(WAVEFORM);
    expect(pub!.maxAttempts).toBe(6);
    expect(typeof pub!.expiresAt).toBe('string');
    expect(typeof pub!.createdAt).toBe('string');
  });

  it('does NOT expose song title or artist', async () => {
    const id = 'ch010002';
    await seedChallenge(id);

    const pub = await getChallenge(id) as unknown as Record<string, unknown>;

    expect(Object.keys(pub)).not.toContain('songTitle');
    expect(Object.keys(pub)).not.toContain('song_title');
    expect(Object.keys(pub)).not.toContain('songArtist');
    expect(Object.keys(pub)).not.toContain('song_artist');
    expect(Object.keys(pub)).not.toContain('song');
  });

  it('guessCount starts at 0', async () => {
    const id = 'ch010003';
    await seedChallenge(id);

    expect((await getChallenge(id))!.guessCount).toBe(0);
  });

  it('completionCount starts at 0', async () => {
    const id = 'ch010004';
    await seedChallenge(id);

    expect((await getChallenge(id))!.completionCount).toBe(0);
  });

  it('audioUrl has the correct format /audio/<filename>', async () => {
    const id = 'ch010005';
    await seedChallenge(id, { audioFilename: `${id}.webm` });

    expect((await getChallenge(id))!.audioUrl).toBe(`/audio/${id}.webm`);
  });

  it('increments guessCount after a guess is submitted', async () => {
    const id = 'ch010006';
    await seedChallenge(id);
    await submitGuess(id, 'wrong answer', 'sess-a');

    expect((await getChallenge(id))!.guessCount).toBe(1);
  });

  it('increments completionCount after a correct guess', async () => {
    const id = 'ch010007';
    await seedChallenge(id);
    await submitGuess(id, 'Bohemian Rhapsody', 'sess-b');

    expect((await getChallenge(id))!.completionCount).toBe(1);
  });
});

// ===========================================================================
// submitGuess — correct guesses
// ===========================================================================

describe('submitGuess – correct guesses', () => {
  it('returns correct: true for an exact title match', async () => {
    const id = 'ch020001';
    await seedChallenge(id);

    const result = await submitGuess(id, 'Bohemian Rhapsody', 'sess-correct-exact');

    expect(result.correct).toBe(true);
  });

  it('returns correct: true for a case-insensitive match', async () => {
    const id = 'ch020002';
    await seedChallenge(id);

    const result = await submitGuess(id, 'BOHEMIAN RHAPSODY', 'sess-correct-case');

    expect(result.correct).toBe(true);
  });

  it('returns correct: true for "title - artist" format', async () => {
    const id = 'ch020003';
    await seedChallenge(id);

    const result = await submitGuess(id, 'Bohemian Rhapsody - Queen', 'sess-correct-combined');

    expect(result.correct).toBe(true);
  });

  it('returns correct: true for a close fuzzy match (minor typo)', async () => {
    const id = 'ch020004';
    await seedChallenge(id);

    const result = await submitGuess(id, 'Bohemian Rhapsodey', 'sess-correct-fuzzy');

    expect(result.correct).toBe(true);
  });

  it('reveals song data when guess is correct', async () => {
    const id = 'ch020005';
    await seedChallenge(id);

    const result = await submitGuess(id, 'Bohemian Rhapsody', 'sess-reveal-correct');

    expect(result.song).toBeDefined();
    expect(result.song!.title).toBe('Bohemian Rhapsody');
    expect(result.song!.artist).toBe('Queen');
    expect(result.song!.id).toBe('spotify:track:abc123');
  });

  it('sets attemptsUsed to 1 on the first correct guess', async () => {
    const id = 'ch020006';
    await seedChallenge(id);

    const result = await submitGuess(id, 'Bohemian Rhapsody', 'sess-attempts-correct');

    expect(result.attemptsUsed).toBe(1);
    expect(result.attemptsRemaining).toBe(5);
    expect(result.maxAttempts).toBe(6);
  });
});

// ===========================================================================
// submitGuess — wrong guesses
// ===========================================================================

describe('submitGuess – wrong guesses', () => {
  it('returns correct: false for a wrong title', async () => {
    const id = 'ch030001';
    await seedChallenge(id);

    const result = await submitGuess(id, 'Stairway to Heaven', 'sess-wrong');

    expect(result.correct).toBe(false);
  });

  it('does NOT reveal song on the first wrong guess', async () => {
    const id = 'ch030002';
    await seedChallenge(id);

    const result = await submitGuess(id, 'Stairway to Heaven', 'sess-no-reveal');

    expect(result.song).toBeUndefined();
  });

  it('increments attemptsUsed on each wrong guess', async () => {
    const id = 'ch030003';
    await seedChallenge(id);
    const session = 'sess-increment';

    const r1 = await submitGuess(id, 'Wrong 1', session);
    const r2 = await submitGuess(id, 'Wrong 2', session);
    const r3 = await submitGuess(id, 'Wrong 3', session);

    expect(r1.attemptsUsed).toBe(1);
    expect(r2.attemptsUsed).toBe(2);
    expect(r3.attemptsUsed).toBe(3);
  });

  it('decrements attemptsRemaining on each wrong guess', async () => {
    const id = 'ch030004';
    await seedChallenge(id);
    const session = 'sess-decrement';

    const r1 = await submitGuess(id, 'Wrong 1', session);
    const r2 = await submitGuess(id, 'Wrong 2', session);

    expect(r1.attemptsRemaining).toBe(5);
    expect(r2.attemptsRemaining).toBe(4);
  });

  it('does NOT reveal song until all 6 attempts are used', async () => {
    const id = 'ch030005';
    await seedChallenge(id);
    const session = 'sess-no-reveal-until-end';

    for (let i = 1; i <= 5; i++) {
      const r = await submitGuess(id, `Wrong ${i}`, session);
      expect(r.song).toBeUndefined();
      expect(r.attemptsRemaining).toBe(6 - i);
    }
  });

  it('reveals song on the 6th (final) wrong guess', async () => {
    const id = 'ch030006';
    await seedChallenge(id);
    const session = 'sess-reveal-on-last';

    for (let i = 1; i <= 5; i++) {
      await submitGuess(id, `Wrong ${i}`, session);
    }

    const r6 = await submitGuess(id, 'Wrong 6', session);
    expect(r6.correct).toBe(false);
    expect(r6.attemptsRemaining).toBe(0);
    expect(r6.song).toBeDefined();
    expect(r6.song!.title).toBe('Bohemian Rhapsody');
  });
});

// ===========================================================================
// submitGuess — attempt limits
// ===========================================================================

describe('submitGuess – attempt limits', () => {
  it('allows exactly 6 attempts before throwing', async () => {
    const id = 'ch040001';
    await seedChallenge(id);
    const session = 'sess-six-allowed';

    for (let i = 1; i <= 6; i++) {
      await expect(submitGuess(id, `Wrong ${i}`, session)).resolves.not.toThrow();
    }
  });

  it('throws a 409 error on the 7th attempt', async () => {
    const id = 'ch040002';
    await seedChallenge(id);
    const session = 'sess-seventh-throws';

    for (let i = 1; i <= 6; i++) {
      await submitGuess(id, `Wrong ${i}`, session);
    }

    await expect(submitGuess(id, 'Wrong 7', session)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws a 409 error if the session already has a correct guess', async () => {
    const id = 'ch040003';
    await seedChallenge(id);
    const session = 'sess-already-correct';

    await submitGuess(id, 'Bohemian Rhapsody', session);

    await expect(submitGuess(id, 'Another guess', session)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('maintains independent attempt counts per session', async () => {
    const id = 'ch040004';
    await seedChallenge(id);

    await submitGuess(id, 'Wrong A1', 'sess-a');
    await submitGuess(id, 'Wrong A2', 'sess-a');
    const rA3 = await submitGuess(id, 'Wrong A3', 'sess-a');

    const rB1 = await submitGuess(id, 'Wrong B1', 'sess-b');

    expect(rA3.attemptsUsed).toBe(3);
    expect(rB1.attemptsUsed).toBe(1);
  });

  it('allows session B to still win after session A exhausts attempts', async () => {
    const id = 'ch040005';
    await seedChallenge(id);

    for (let i = 1; i <= 6; i++) {
      await submitGuess(id, `Wrong A${i}`, 'sess-a-exhaust');
    }

    const rB = await submitGuess(id, 'Bohemian Rhapsody', 'sess-b-win');
    expect(rB.correct).toBe(true);
  });
});

// ===========================================================================
// submitGuess — edge cases
// ===========================================================================

describe('submitGuess – edge cases', () => {
  it('throws a 404 error for a non-existent challenge', async () => {
    await expect(submitGuess('nonexistent', 'any guess', 'sess-404')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('generates a sessionId when none is provided', async () => {
    const id = 'ch050001';
    await seedChallenge(id);

    const result = await submitGuess(id, 'wrong answer');

    expect(typeof result.sessionId).toBe('string');
    expect(result.sessionId.length).toBeGreaterThan(0);
  });

  it('generated sessionId is used consistently for subsequent guesses when passed back', async () => {
    const id = 'ch050002';
    await seedChallenge(id);

    const r1 = await submitGuess(id, 'Wrong 1');
    const generatedId = r1.sessionId;

    const r2 = await submitGuess(id, 'Wrong 2', generatedId);

    expect(r2.attemptsUsed).toBe(2);
    expect(r2.sessionId).toBe(generatedId);
  });

  it('returns the sessionId in the result even when correct on first attempt', async () => {
    const id = 'ch050003';
    await seedChallenge(id);

    const result = await submitGuess(id, 'Bohemian Rhapsody');

    expect(typeof result.sessionId).toBe('string');
    expect(result.sessionId.length).toBeGreaterThan(0);
  });

  it('timeTakenSeconds is 0 for the very first guess in a session', async () => {
    const id = 'ch050004';
    await seedChallenge(id);

    const result = await submitGuess(id, 'anything', 'sess-time');

    expect(result.timeTakenSeconds).toBe(0);
  });
});

// ===========================================================================
// getResult
// ===========================================================================

describe('getResult', () => {
  it('returns null for a non-existent challenge', async () => {
    expect(await getResult('doesnotexist', 'any-session')).toBeNull();
  });

  it('returns null for a session with no guesses', async () => {
    const id = 'ch060001';
    await seedChallenge(id);

    expect(await getResult(id, 'sess-no-guesses')).toBeNull();
  });

  it('returns a complete result for a winning session', async () => {
    const id = 'ch060002';
    await seedChallenge(id);
    const session = 'sess-win';

    await submitGuess(id, 'Wrong 1', session);
    await submitGuess(id, 'Bohemian Rhapsody', session);

    const result = await getResult(id, session);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(id);
    expect(result!.correct).toBe(true);
    expect(result!.attemptsUsed).toBe(2);
    expect(result!.maxAttempts).toBe(6);
    expect(result!.song.title).toBe('Bohemian Rhapsody');
    expect(result!.song.artist).toBe('Queen');
    expect(result!.waveformData).toEqual(WAVEFORM);
    expect(typeof result!.expiresAt).toBe('string');
    expect(typeof result!.createdAt).toBe('string');
  });

  it('returns a complete result for a losing session (all 6 wrong)', async () => {
    const id = 'ch060003';
    await seedChallenge(id);
    const session = 'sess-lose';

    for (let i = 1; i <= 6; i++) {
      await submitGuess(id, `Wrong ${i}`, session);
    }

    const result = await getResult(id, session);

    expect(result).not.toBeNull();
    expect(result!.correct).toBe(false);
    expect(result!.attemptsUsed).toBe(6);
  });

  it('shareText contains Wordle-style squares', async () => {
    const id = 'ch060004';
    await seedChallenge(id);
    const session = 'sess-share-text';

    await submitGuess(id, 'Wrong 1', session);
    await submitGuess(id, 'Wrong 2', session);
    await submitGuess(id, 'Bohemian Rhapsody', session);

    const result = await getResult(id, session);

    expect(result!.shareText).toContain('🟥');
    expect(result!.shareText).toContain('🟩');
    expect(result!.shareText).toContain('⬜');
  });

  it('shareText uses X/6 label for a losing session', async () => {
    const id = 'ch060005';
    await seedChallenge(id);
    const session = 'sess-loss-label';

    for (let i = 1; i <= 6; i++) {
      await submitGuess(id, `Wrong ${i}`, session);
    }

    const result = await getResult(id, session);

    expect(result!.shareText).toContain('X/6');
  });

  it('shareText uses n/6 label for a winning session', async () => {
    const id = 'ch060006';
    await seedChallenge(id);
    const session = 'sess-win-label';

    await submitGuess(id, 'Wrong 1', session);
    await submitGuess(id, 'Bohemian Rhapsody', session);

    const result = await getResult(id, session);

    expect(result!.shareText).toContain('2/6');
  });

  it('shareText contains the challenge URL', async () => {
    const id = 'ch060007';
    await seedChallenge(id);
    const session = 'sess-url';

    await submitGuess(id, 'Bohemian Rhapsody', session);

    const result = await getResult(id, session);

    expect(result!.shareText).toContain(`https://humduel.app/c/${id}`);
  });

  it('shareText contains the challenge short id prefix', async () => {
    const id = 'ch060008';
    await seedChallenge(id);
    const session = 'sess-short-id';

    await submitGuess(id, 'Bohemian Rhapsody', session);

    const result = await getResult(id, session);

    expect(result!.shareText).toContain(`HumDuel #${id.slice(0, 6)}`);
  });

  it('returns song data in the result', async () => {
    const id = 'ch060009';
    await seedChallenge(id, { songId: 'spotify:track:xyz' });
    const session = 'sess-song-data';

    await submitGuess(id, 'Bohemian Rhapsody', session);

    const result = await getResult(id, session);

    expect(result!.song).toMatchObject({
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      id: 'spotify:track:xyz',
    });
  });

  it('all 6 squares are red for a full losing session', async () => {
    const id = 'ch060010';
    await seedChallenge(id);
    const session = 'sess-all-red';

    for (let i = 1; i <= 6; i++) {
      await submitGuess(id, `Wrong ${i}`, session);
    }

    const result = await getResult(id, session);

    const redCount = (result!.shareText.match(/🟥/g) ?? []).length;
    expect(redCount).toBe(6);
    expect(result!.shareText).not.toContain('🟩');
  });

  it('first square is green when solved on attempt 1', async () => {
    const id = 'ch060011';
    await seedChallenge(id);
    const session = 'sess-first-green';

    await submitGuess(id, 'Bohemian Rhapsody', session);

    const result = await getResult(id, session);

    expect(result!.shareText).toContain('🟩');
    const greenCount = (result!.shareText.match(/🟩/g) ?? []).length;
    const emptyCount = (result!.shareText.match(/⬜/g) ?? []).length;
    expect(greenCount).toBe(1);
    expect(emptyCount).toBe(5);
  });
});
