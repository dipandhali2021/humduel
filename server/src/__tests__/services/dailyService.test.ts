/**
 * Unit tests for dailyService.ts
 *
 * Mocking strategy:
 *   An in-memory SQLite database is created inside vi.hoisted() (which runs
 *   before vi.mock() factories) and the real schema is applied to it.  The
 *   database singleton and the config module are then replaced with the
 *   in-memory instance and a fixed DAILY_EPOCH before the service is imported.
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
// Replace the database singleton and config module
// ---------------------------------------------------------------------------

vi.mock('../../database.js', () => ({ default: testDb }));

vi.mock('../../config.js', () => ({
  DAILY_EPOCH: '2026-04-01',
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
  it('creates a new row when none exists for the date', () => {
    const row = ensureDailyChallenge('2026-04-10');
    expect(row).toBeDefined();
    expect(row.date).toBe('2026-04-10');
  });

  it('stores the correct puzzle_number', () => {
    const row = ensureDailyChallenge('2026-04-10');
    // April 10 is 9 days after April 1, so puzzle #10
    expect(row.puzzle_number).toBe(10);
  });

  it('stores non-empty song_title and song_artist', () => {
    const row = ensureDailyChallenge('2026-04-15');
    expect(typeof row.song_title).toBe('string');
    expect(row.song_title.length).toBeGreaterThan(0);
    expect(typeof row.song_artist).toBe('string');
    expect(row.song_artist.length).toBeGreaterThan(0);
  });

  it('returns the existing row without creating a duplicate on second call', () => {
    const first = ensureDailyChallenge('2026-04-20');
    const second = ensureDailyChallenge('2026-04-20');
    expect(second.id).toBe(first.id);
    expect(second.song_title).toBe(first.song_title);

    const count = (
      testDb
        .prepare('SELECT COUNT(*) AS cnt FROM daily_challenges WHERE date = ?')
        .get('2026-04-20') as { cnt: number }
    ).cnt;
    expect(count).toBe(1);
  });

  it('sets song_id, spotify_preview_url, and spotify_album_art to null', () => {
    const row = ensureDailyChallenge('2026-04-25');
    expect(row.song_id).toBeNull();
    expect(row.spotify_preview_url).toBeNull();
    expect(row.spotify_album_art).toBeNull();
  });
});

// ===========================================================================
// getDailyChallenge
// ===========================================================================

describe('getDailyChallenge', () => {
  it('returns the correct public shape', () => {
    const session = freshSession();
    const pub = getDailyChallenge('2026-04-01', session);

    expect(pub.date).toBe('2026-04-01');
    expect(typeof pub.puzzleNumber).toBe('number');
    expect(pub.maxAttempts).toBe(6);
    expect(pub.attemptsUsed).toBe(0);
    expect(pub.completed).toBe(false);
    expect(pub.won).toBeNull();
  });

  it('reflects attemptsUsed from previous guesses for the session', () => {
    const date = '2026-04-02';
    const session = freshSession();

    submitDailyGuess(date, 'wrong guess 1', session);
    submitDailyGuess(date, 'wrong guess 2', session);

    const pub = getDailyChallenge(date, session);
    expect(pub.attemptsUsed).toBe(2);
  });

  it('does NOT expose the song title or artist in the public view', () => {
    const session = freshSession();
    const pub = getDailyChallenge('2026-04-03', session) as unknown as Record<string, unknown>;

    expect(Object.keys(pub)).not.toContain('songTitle');
    expect(Object.keys(pub)).not.toContain('song_title');
    expect(Object.keys(pub)).not.toContain('songArtist');
    expect(Object.keys(pub)).not.toContain('song_artist');
  });

  it('marks completed and won after a correct guess', () => {
    const date = '2026-04-04';
    const session = freshSession();

    // Find which song is selected for this date so we can guess correctly
    ensureDailyChallenge(date);
    const row = testDb
      .prepare('SELECT song_title FROM daily_challenges WHERE date = ?')
      .get(date) as { song_title: string };

    submitDailyGuess(date, row.song_title, session);

    const pub = getDailyChallenge(date, session);
    expect(pub.completed).toBe(true);
    expect(pub.won).toBe(true);
  });

  it('marks completed with won=false after all attempts are exhausted', () => {
    const date = '2026-04-05';
    const session = freshSession();

    for (let i = 1; i <= 6; i++) {
      submitDailyGuess(date, `definitely wrong ${i}`, session);
    }

    const pub = getDailyChallenge(date, session);
    expect(pub.completed).toBe(true);
    expect(pub.won).toBe(false);
  });

  it('isolates attemptsUsed per session', () => {
    const date = '2026-04-06';
    const sessionA = freshSession();
    const sessionB = freshSession();

    submitDailyGuess(date, 'wrong A', sessionA);
    submitDailyGuess(date, 'wrong A2', sessionA);

    const pubA = getDailyChallenge(date, sessionA);
    const pubB = getDailyChallenge(date, sessionB);

    expect(pubA.attemptsUsed).toBe(2);
    expect(pubB.attemptsUsed).toBe(0);
  });
});

// ===========================================================================
// submitDailyGuess — correct guesses
// ===========================================================================

describe('submitDailyGuess — correct guesses', () => {
  it('returns correct: true for an exact title match', () => {
    const date = '2026-04-07';
    const session = freshSession();

    ensureDailyChallenge(date);
    const { song_title } = testDb
      .prepare('SELECT song_title FROM daily_challenges WHERE date = ?')
      .get(date) as { song_title: string };

    const result = submitDailyGuess(date, song_title, session);
    expect(result.correct).toBe(true);
  });

  it('returns correct: true for a case-insensitive match', () => {
    const date = '2026-04-08';
    const session = freshSession();

    ensureDailyChallenge(date);
    const { song_title } = testDb
      .prepare('SELECT song_title FROM daily_challenges WHERE date = ?')
      .get(date) as { song_title: string };

    const result = submitDailyGuess(date, song_title.toUpperCase(), session);
    expect(result.correct).toBe(true);
  });

  it('reveals song data when guess is correct', () => {
    const date = '2026-04-09';
    const session = freshSession();

    ensureDailyChallenge(date);
    const { song_title, song_artist } = testDb
      .prepare('SELECT song_title, song_artist FROM daily_challenges WHERE date = ?')
      .get(date) as { song_title: string; song_artist: string };

    const result = submitDailyGuess(date, song_title, session);

    expect(result.song).toBeDefined();
    expect(result.song!.title).toBe(song_title);
    expect(result.song!.artist).toBe(song_artist);
  });

  it('sets attemptsUsed to 1 on the first correct guess', () => {
    const date = '2026-04-10';
    const session = freshSession();

    ensureDailyChallenge(date);
    const { song_title } = testDb
      .prepare('SELECT song_title FROM daily_challenges WHERE date = ?')
      .get(date) as { song_title: string };

    const result = submitDailyGuess(date, song_title, session);
    expect(result.attemptsUsed).toBe(1);
    expect(result.attemptsRemaining).toBe(5);
    expect(result.maxAttempts).toBe(6);
  });
});

// ===========================================================================
// submitDailyGuess — wrong guesses
// ===========================================================================

describe('submitDailyGuess — wrong guesses', () => {
  it('returns correct: false for an obviously wrong guess', () => {
    const date = '2026-04-11';
    const session = freshSession();

    const result = submitDailyGuess(date, 'zzz_no_such_song_zzz', session);
    expect(result.correct).toBe(false);
  });

  it('does NOT reveal song on a wrong guess', () => {
    const date = '2026-04-12';
    const session = freshSession();

    const result = submitDailyGuess(date, 'wrong song title', session);
    expect(result.song).toBeUndefined();
  });

  it('increments attemptsUsed on each wrong guess', () => {
    const date = '2026-04-13';
    const session = freshSession();

    const r1 = submitDailyGuess(date, 'wrong 1', session);
    const r2 = submitDailyGuess(date, 'wrong 2', session);
    const r3 = submitDailyGuess(date, 'wrong 3', session);

    expect(r1.attemptsUsed).toBe(1);
    expect(r2.attemptsUsed).toBe(2);
    expect(r3.attemptsUsed).toBe(3);
  });

  it('decrements attemptsRemaining on each wrong guess', () => {
    const date = '2026-04-14';
    const session = freshSession();

    const r1 = submitDailyGuess(date, 'wrong 1', session);
    const r2 = submitDailyGuess(date, 'wrong 2', session);

    expect(r1.attemptsRemaining).toBe(5);
    expect(r2.attemptsRemaining).toBe(4);
  });

  it('does NOT reveal song until all 6 attempts are used', () => {
    const date = '2026-04-15';
    const session = freshSession();

    for (let i = 1; i <= 5; i++) {
      const r = submitDailyGuess(date, `wrong ${i}`, session);
      expect(r.song).toBeUndefined();
    }
  });

  it('reveals song on the 6th (final) wrong guess', () => {
    const date = '2026-04-16';
    const session = freshSession();

    for (let i = 1; i <= 5; i++) {
      submitDailyGuess(date, `wrong ${i}`, session);
    }

    const r6 = submitDailyGuess(date, 'wrong 6', session);
    expect(r6.correct).toBe(false);
    expect(r6.attemptsRemaining).toBe(0);
    expect(r6.song).toBeDefined();
    expect(typeof r6.song!.title).toBe('string');
  });
});

// ===========================================================================
// submitDailyGuess — 409 when already complete
// ===========================================================================

describe('submitDailyGuess — 409 when already complete', () => {
  it('throws 409 when session has already guessed correctly', () => {
    const date = '2026-04-17';
    const session = freshSession();

    ensureDailyChallenge(date);
    const { song_title } = testDb
      .prepare('SELECT song_title FROM daily_challenges WHERE date = ?')
      .get(date) as { song_title: string };

    submitDailyGuess(date, song_title, session);

    let caughtError: unknown;
    try {
      submitDailyGuess(date, song_title, session);
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect((caughtError as { statusCode: number }).statusCode).toBe(409);
  });

  it('throws 409 when session has exhausted all 6 attempts', () => {
    const date = '2026-04-18';
    const session = freshSession();

    for (let i = 1; i <= 6; i++) {
      submitDailyGuess(date, `wrong ${i}`, session);
    }

    let caughtError: unknown;
    try {
      submitDailyGuess(date, 'one more wrong', session);
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect((caughtError as { statusCode: number }).statusCode).toBe(409);
  });

  it('allows a fresh session to play even after another session is exhausted', () => {
    const date = '2026-04-19';
    const sessionA = freshSession();
    const sessionB = freshSession();

    for (let i = 1; i <= 6; i++) {
      submitDailyGuess(date, `wrong A${i}`, sessionA);
    }

    const result = submitDailyGuess(date, 'wrong B1', sessionB);
    expect(result.attemptsUsed).toBe(1);
  });
});

// ===========================================================================
// getDailyResult
// ===========================================================================

describe('getDailyResult', () => {
  it('returns null when no daily_challenges row exists for the date', () => {
    const result = getDailyResult('2099-01-01', 'some-session');
    expect(result).toBeNull();
  });

  it('returns null for a session with no guesses', () => {
    ensureDailyChallenge('2026-04-20');
    const result = getDailyResult('2026-04-20', freshSession());
    expect(result).toBeNull();
  });

  it('returns null for an unfinished session (some guesses, not yet done)', () => {
    const date = '2026-04-21';
    const session = freshSession();

    submitDailyGuess(date, 'wrong 1', session);
    submitDailyGuess(date, 'wrong 2', session);

    const result = getDailyResult(date, session);
    expect(result).toBeNull();
  });

  it('returns a completed result when session won', () => {
    const date = '2026-04-22';
    const session = freshSession();

    ensureDailyChallenge(date);
    const { song_title, song_artist } = testDb
      .prepare('SELECT song_title, song_artist FROM daily_challenges WHERE date = ?')
      .get(date) as { song_title: string; song_artist: string };

    submitDailyGuess(date, 'wrong 1', session);
    submitDailyGuess(date, song_title, session);

    const result = getDailyResult(date, session);

    expect(result).not.toBeNull();
    expect(result!.date).toBe(date);
    expect(result!.correct).toBe(true);
    expect(result!.attemptsUsed).toBe(2);
    expect(result!.maxAttempts).toBe(6);
    expect(result!.song.title).toBe(song_title);
    expect(result!.song.artist).toBe(song_artist);
  });

  it('returns a completed result when session is exhausted (lost)', () => {
    const date = '2026-04-23';
    const session = freshSession();

    for (let i = 1; i <= 6; i++) {
      submitDailyGuess(date, `wrong ${i}`, session);
    }

    const result = getDailyResult(date, session);

    expect(result).not.toBeNull();
    expect(result!.correct).toBe(false);
    expect(result!.attemptsUsed).toBe(6);
  });

  it('shareText contains HumDuel Daily header with puzzle number', () => {
    const date = '2026-04-24';
    const session = freshSession();

    ensureDailyChallenge(date);
    const { song_title } = testDb
      .prepare('SELECT song_title FROM daily_challenges WHERE date = ?')
      .get(date) as { song_title: string };
    submitDailyGuess(date, song_title, session);

    const result = getDailyResult(date, session);
    expect(result!.shareText).toContain('HumDuel Daily #');
    expect(result!.shareText).toContain('humduel.app/daily');
  });

  it('shareText uses n/6 format for a win', () => {
    const date = '2026-04-25';
    const session = freshSession();

    ensureDailyChallenge(date);
    const { song_title } = testDb
      .prepare('SELECT song_title FROM daily_challenges WHERE date = ?')
      .get(date) as { song_title: string };

    submitDailyGuess(date, 'wrong 1', session);
    submitDailyGuess(date, song_title, session);

    const result = getDailyResult(date, session);
    expect(result!.shareText).toContain('2/6');
  });

  it('shareText uses X/6 for a loss', () => {
    const date = '2026-04-26';
    const session = freshSession();

    for (let i = 1; i <= 6; i++) {
      submitDailyGuess(date, `wrong ${i}`, session);
    }

    const result = getDailyResult(date, session);
    expect(result!.shareText).toContain('X/6');
  });

  it('shareText contains green square on win', () => {
    const date = '2026-04-27';
    const session = freshSession();

    ensureDailyChallenge(date);
    const { song_title } = testDb
      .prepare('SELECT song_title FROM daily_challenges WHERE date = ?')
      .get(date) as { song_title: string };
    submitDailyGuess(date, song_title, session);

    const result = getDailyResult(date, session);
    expect(result!.shareText).toContain('🟩');
    expect(result!.shareText).not.toContain('🟥');
  });

  it('shareText has 6 red squares for a full loss', () => {
    const date = '2026-04-28';
    const session = freshSession();

    for (let i = 1; i <= 6; i++) {
      submitDailyGuess(date, `wrong ${i}`, session);
    }

    const result = getDailyResult(date, session);
    const redCount = (result!.shareText.match(/🟥/g) ?? []).length;
    expect(redCount).toBe(6);
    expect(result!.shareText).not.toContain('🟩');
  });

  it('includes puzzleNumber in the result', () => {
    const date = '2026-04-01';
    const session = freshSession();

    ensureDailyChallenge(date);
    const { song_title } = testDb
      .prepare('SELECT song_title FROM daily_challenges WHERE date = ?')
      .get(date) as { song_title: string };
    submitDailyGuess(date, song_title, session);

    const result = getDailyResult(date, session);
    expect(result!.puzzleNumber).toBe(1);
  });
});
