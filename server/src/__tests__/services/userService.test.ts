/**
 * Unit tests for userService.ts
 *
 * Mocking strategy:
 *   An in-memory SQLite database is created inside vi.hoisted() with the full
 *   schema applied.  The database singleton is replaced before the service is
 *   imported so all prepared statements bind to the in-memory instance.
 *
 *   nanoid is NOT mocked — the generated IDs just need to be non-empty strings
 *   with the expected length (12 chars).
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

const {
  createUser,
  getUser,
  updateUser,
  updateUserStats,
  toUserPublic,
} = await import('../../services/userService.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let nicknameCounter = 0;
function uniqueNick(base = 'User'): string {
  return `${base}${++nicknameCounter}`;
}

// ---------------------------------------------------------------------------
// Cleanup between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  testDb.exec('DELETE FROM daily_guesses');
  testDb.exec('DELETE FROM users');
});

// ===========================================================================
// createUser
// ===========================================================================

describe('createUser', () => {
  it('returns a UserRow with expected fields', () => {
    const nick = uniqueNick();
    const user = createUser(nick);

    expect(user.nickname).toBe(nick);
    expect(typeof user.id).toBe('string');
    expect(user.id.length).toBe(12);
    expect(user.avatar).toBe('default');
    expect(user.games_played).toBe(0);
    expect(user.games_won).toBe(0);
    expect(user.current_streak).toBe(0);
    expect(user.best_streak).toBe(0);
    expect(user.last_played_date).toBeNull();
  });

  it('generates a unique id for each user', () => {
    const u1 = createUser(uniqueNick());
    const u2 = createUser(uniqueNick());
    expect(u1.id).not.toBe(u2.id);
  });

  it('trims whitespace from the nickname before storing', () => {
    const user = createUser('  TrimMe  ');
    expect(user.nickname).toBe('TrimMe');
  });

  it('persists the user to the database', () => {
    const nick = uniqueNick();
    const created = createUser(nick);
    const fetched = testDb
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(created.id) as { id: string; nickname: string } | undefined;

    expect(fetched).toBeDefined();
    expect(fetched!.nickname).toBe(nick);
  });

  it('throws 400 when nickname is too short (1 character)', () => {
    let err: unknown;
    try {
      createUser('x');
    } catch (e) {
      err = e;
    }
    expect((err as { statusCode: number }).statusCode).toBe(400);
  });

  it('throws 400 when nickname is too long (21 characters)', () => {
    let err: unknown;
    try {
      createUser('a'.repeat(21));
    } catch (e) {
      err = e;
    }
    expect((err as { statusCode: number }).statusCode).toBe(400);
  });

  it('throws 400 when nickname contains invalid characters', () => {
    let err: unknown;
    try {
      createUser('bad!name');
    } catch (e) {
      err = e;
    }
    expect((err as { statusCode: number }).statusCode).toBe(400);
  });

  it('accepts a nickname with exactly 2 characters', () => {
    const user = createUser('AB');
    expect(user.nickname).toBe('AB');
  });

  it('accepts a nickname with exactly 20 characters', () => {
    const user = createUser('a'.repeat(20));
    expect(user.nickname).toBe('a'.repeat(20));
  });

  it('accepts a nickname with spaces in the middle', () => {
    const user = createUser('DJ Khaled');
    expect(user.nickname).toBe('DJ Khaled');
  });

  it('throws 409 when nickname is already taken', () => {
    const nick = uniqueNick('DupNick');
    createUser(nick);

    let err: unknown;
    try {
      createUser(nick);
    } catch (e) {
      err = e;
    }
    expect((err as { statusCode: number }).statusCode).toBe(409);
  });

  it('throws 409 for a duplicate nickname that differs only in surrounding whitespace', () => {
    const nick = uniqueNick('SpaceNick');
    createUser(nick);

    let err: unknown;
    try {
      createUser(`  ${nick}  `);
    } catch (e) {
      err = e;
    }
    expect((err as { statusCode: number }).statusCode).toBe(409);
  });
});

// ===========================================================================
// getUser
// ===========================================================================

describe('getUser', () => {
  it('returns null for a non-existent id', () => {
    expect(getUser('does-not-exist-id')).toBeNull();
  });

  it('returns the correct UserRow for an existing user', () => {
    const nick = uniqueNick();
    const created = createUser(nick);
    const fetched = getUser(created.id);

    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(created.id);
    expect(fetched!.nickname).toBe(nick);
  });

  it('returns null after the user table is cleared', () => {
    const created = createUser(uniqueNick());
    testDb.exec('DELETE FROM users');
    expect(getUser(created.id)).toBeNull();
  });
});

// ===========================================================================
// updateUser
// ===========================================================================

describe('updateUser', () => {
  it('throws 404 when the user does not exist', () => {
    let err: unknown;
    try {
      updateUser('nonexistent-id', { nickname: 'Valid' });
    } catch (e) {
      err = e;
    }
    expect((err as { statusCode: number }).statusCode).toBe(404);
  });

  it('updates the nickname when provided', () => {
    const user = createUser(uniqueNick());
    const newNick = uniqueNick('Updated');
    const updated = updateUser(user.id, { nickname: newNick });
    expect(updated.nickname).toBe(newNick);
  });

  it('updates the avatar when provided', () => {
    const user = createUser(uniqueNick());
    const updated = updateUser(user.id, { avatar: 'avatar-2' });
    expect(updated.avatar).toBe('avatar-2');
  });

  it('updates both nickname and avatar when both are provided', () => {
    const user = createUser(uniqueNick());
    const newNick = uniqueNick('BothUpdate');
    const updated = updateUser(user.id, { nickname: newNick, avatar: 'avatar-3' });
    expect(updated.nickname).toBe(newNick);
    expect(updated.avatar).toBe('avatar-3');
  });

  it('allows a user to keep their own nickname (update to same value)', () => {
    const user = createUser(uniqueNick('SameNick'));
    const updated = updateUser(user.id, { nickname: user.nickname });
    expect(updated.nickname).toBe(user.nickname);
  });

  it('throws 409 when the new nickname is taken by another user', () => {
    const u1 = createUser(uniqueNick('ConflictA'));
    const u2 = createUser(uniqueNick('ConflictB'));

    let err: unknown;
    try {
      updateUser(u2.id, { nickname: u1.nickname });
    } catch (e) {
      err = e;
    }
    expect((err as { statusCode: number }).statusCode).toBe(409);
  });

  it('throws 400 for an invalid new nickname', () => {
    const user = createUser(uniqueNick());
    let err: unknown;
    try {
      updateUser(user.id, { nickname: '!' });
    } catch (e) {
      err = e;
    }
    expect((err as { statusCode: number }).statusCode).toBe(400);
  });

  it('returns the updated UserRow from the database', () => {
    const user = createUser(uniqueNick());
    const newNick = uniqueNick('ReturnCheck');
    const updated = updateUser(user.id, { nickname: newNick });

    expect(updated.id).toBe(user.id);
    expect(updated.nickname).toBe(newNick);
  });
});

// ===========================================================================
// updateUserStats
// ===========================================================================

describe('updateUserStats', () => {
  it('silently does nothing for a non-existent user', () => {
    expect(() => updateUserStats('ghost-id', '2026-04-01', true)).not.toThrow();
  });

  it('increments games_played by 1', () => {
    const user = createUser(uniqueNick());
    updateUserStats(user.id, '2026-04-01', true);
    const updated = getUser(user.id)!;
    expect(updated.games_played).toBe(1);
  });

  it('increments games_won when won is true', () => {
    const user = createUser(uniqueNick());
    updateUserStats(user.id, '2026-04-01', true);
    const updated = getUser(user.id)!;
    expect(updated.games_won).toBe(1);
  });

  it('does NOT increment games_won when won is false', () => {
    const user = createUser(uniqueNick());
    updateUserStats(user.id, '2026-04-01', false);
    const updated = getUser(user.id)!;
    expect(updated.games_won).toBe(0);
  });

  it('sets current_streak to 1 for the first win', () => {
    const user = createUser(uniqueNick());
    updateUserStats(user.id, '2026-04-01', true);
    const updated = getUser(user.id)!;
    expect(updated.current_streak).toBe(1);
  });

  it('sets current_streak to 0 for the first loss', () => {
    const user = createUser(uniqueNick());
    updateUserStats(user.id, '2026-04-01', false);
    const updated = getUser(user.id)!;
    expect(updated.current_streak).toBe(0);
  });

  it('increments streak on consecutive days (win then win)', () => {
    const user = createUser(uniqueNick());
    updateUserStats(user.id, '2026-04-01', true);
    updateUserStats(user.id, '2026-04-02', true);
    const updated = getUser(user.id)!;
    expect(updated.current_streak).toBe(2);
  });

  it('resets streak to 0 on loss after a winning streak', () => {
    const user = createUser(uniqueNick());
    updateUserStats(user.id, '2026-04-01', true);
    updateUserStats(user.id, '2026-04-02', true);
    updateUserStats(user.id, '2026-04-03', false);
    const updated = getUser(user.id)!;
    expect(updated.current_streak).toBe(0);
  });

  it('resets streak to 1 for win after a gap in play', () => {
    const user = createUser(uniqueNick());
    updateUserStats(user.id, '2026-04-01', true);
    updateUserStats(user.id, '2026-04-02', true);
    // gap — skipping April 3
    updateUserStats(user.id, '2026-04-04', true);
    const updated = getUser(user.id)!;
    expect(updated.current_streak).toBe(1);
  });

  it('is idempotent for the same date (does not double-count)', () => {
    const user = createUser(uniqueNick());
    updateUserStats(user.id, '2026-04-01', true);
    updateUserStats(user.id, '2026-04-01', true);
    const updated = getUser(user.id)!;
    // games_played increments each call — streak should not grow
    expect(updated.current_streak).toBe(1);
  });

  it('tracks best_streak as the highest current_streak seen', () => {
    const user = createUser(uniqueNick());
    updateUserStats(user.id, '2026-04-01', true);
    updateUserStats(user.id, '2026-04-02', true);
    updateUserStats(user.id, '2026-04-03', true);
    // now lose and break streak
    updateUserStats(user.id, '2026-04-04', false);

    const updated = getUser(user.id)!;
    expect(updated.best_streak).toBe(3);
    expect(updated.current_streak).toBe(0);
  });

  it('updates last_played_date to the given date', () => {
    const user = createUser(uniqueNick());
    updateUserStats(user.id, '2026-04-15', true);
    const updated = getUser(user.id)!;
    expect(updated.last_played_date).toBe('2026-04-15');
  });
});

// ===========================================================================
// toUserPublic
// ===========================================================================

describe('toUserPublic', () => {
  it('maps id, nickname, avatar, and createdAt correctly', () => {
    const user = createUser(uniqueNick('PublicMap'));
    const pub = toUserPublic(user);

    expect(pub.id).toBe(user.id);
    expect(pub.nickname).toBe(user.nickname);
    expect(pub.avatar).toBe(user.avatar);
    expect(pub.createdAt).toBe(user.created_at);
  });

  it('does NOT expose games_played or streak fields', () => {
    const user = createUser(uniqueNick('NoPrivate'));
    const pub = toUserPublic(user) as unknown as Record<string, unknown>;

    expect(Object.keys(pub)).not.toContain('games_played');
    expect(Object.keys(pub)).not.toContain('games_won');
    expect(Object.keys(pub)).not.toContain('current_streak');
    expect(Object.keys(pub)).not.toContain('best_streak');
    expect(Object.keys(pub)).not.toContain('last_played_date');
  });

  it('has exactly four keys', () => {
    const user = createUser(uniqueNick('FourKeys'));
    const pub = toUserPublic(user);
    expect(Object.keys(pub).length).toBe(4);
  });
});
