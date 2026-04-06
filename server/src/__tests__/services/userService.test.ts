/**
 * Unit tests for userService.ts
 *
 * Mocking strategy:
 *   An in-memory SQLite database is created inside vi.hoisted() with the full
 *   schema applied.  The getDb() function is mocked to return a wrapper that
 *   provides an async API around the synchronous SQLite instance.
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

const {
  createUser,
  getUser,
  getUserByNickname,
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
  it('returns a UserRow with expected fields', async () => {
    const nick = uniqueNick();
    const user = await createUser(nick);

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

  it('generates a unique id for each user', async () => {
    const u1 = await createUser(uniqueNick());
    const u2 = await createUser(uniqueNick());
    expect(u1.id).not.toBe(u2.id);
  });

  it('trims whitespace from the nickname before storing', async () => {
    const user = await createUser('  TrimMe  ');
    expect(user.nickname).toBe('TrimMe');
  });

  it('persists the user to the database', async () => {
    const nick = uniqueNick();
    const created = await createUser(nick);
    const fetched = testDb
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(created.id) as { id: string; nickname: string } | undefined;

    expect(fetched).toBeDefined();
    expect(fetched!.nickname).toBe(nick);
  });

  it('throws 400 when nickname is too short (1 character)', async () => {
    await expect(createUser('x')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when nickname is too long (21 characters)', async () => {
    await expect(createUser('a'.repeat(21))).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when nickname contains invalid characters', async () => {
    await expect(createUser('bad!name')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('accepts a nickname with exactly 2 characters', async () => {
    const user = await createUser('AB');
    expect(user.nickname).toBe('AB');
  });

  it('accepts a nickname with exactly 20 characters', async () => {
    const user = await createUser('a'.repeat(20));
    expect(user.nickname).toBe('a'.repeat(20));
  });

  it('accepts a nickname with spaces in the middle', async () => {
    const user = await createUser('DJ Khaled');
    expect(user.nickname).toBe('DJ Khaled');
  });

  it('throws 409 when nickname is already taken', async () => {
    const nick = uniqueNick('DupNick');
    await createUser(nick);
    await expect(createUser(nick)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws 409 for a duplicate nickname that differs only in surrounding whitespace', async () => {
    const nick = uniqueNick('SpaceNick');
    await createUser(nick);
    await expect(createUser(`  ${nick}  `)).rejects.toMatchObject({ statusCode: 409 });
  });
});

// ===========================================================================
// getUser
// ===========================================================================

describe('getUser', () => {
  it('returns null for a non-existent id', async () => {
    expect(await getUser('does-not-exist-id')).toBeNull();
  });

  it('returns the correct UserRow for an existing user', async () => {
    const nick = uniqueNick();
    const created = await createUser(nick);
    const fetched = await getUser(created.id);

    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(created.id);
    expect(fetched!.nickname).toBe(nick);
  });

  it('returns null after the user table is cleared', async () => {
    const created = await createUser(uniqueNick());
    testDb.exec('DELETE FROM users');
    expect(await getUser(created.id)).toBeNull();
  });
});

// ===========================================================================
// getUserByNickname
// ===========================================================================

describe('getUserByNickname', () => {
  it('returns null for a non-existent nickname', async () => {
    expect(await getUserByNickname('nonexistent')).toBeNull();
  });

  it('returns the user when nickname exists', async () => {
    const nick = uniqueNick('ByNick');
    const created = await createUser(nick);
    const fetched = await getUserByNickname(nick);
    
    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(created.id);
  });
});

// ===========================================================================
// updateUser
// ===========================================================================

describe('updateUser', () => {
  it('throws 404 when the user does not exist', async () => {
    await expect(updateUser('nonexistent-id', { nickname: 'Valid' })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('updates the nickname when provided', async () => {
    const user = await createUser(uniqueNick());
    const newNick = uniqueNick('Updated');
    const updated = await updateUser(user.id, { nickname: newNick });
    expect(updated.nickname).toBe(newNick);
  });

  it('updates the avatar when provided', async () => {
    const user = await createUser(uniqueNick());
    const updated = await updateUser(user.id, { avatar: 'avatar-2' });
    expect(updated.avatar).toBe('avatar-2');
  });

  it('updates both nickname and avatar when both are provided', async () => {
    const user = await createUser(uniqueNick());
    const newNick = uniqueNick('BothUpdate');
    const updated = await updateUser(user.id, { nickname: newNick, avatar: 'avatar-3' });
    expect(updated.nickname).toBe(newNick);
    expect(updated.avatar).toBe('avatar-3');
  });

  it('allows a user to keep their own nickname (update to same value)', async () => {
    const user = await createUser(uniqueNick('SameNick'));
    const updated = await updateUser(user.id, { nickname: user.nickname });
    expect(updated.nickname).toBe(user.nickname);
  });

  it('throws 409 when the new nickname is taken by another user', async () => {
    const u1 = await createUser(uniqueNick('ConflictA'));
    const u2 = await createUser(uniqueNick('ConflictB'));
    await expect(updateUser(u2.id, { nickname: u1.nickname })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws 400 for an invalid new nickname', async () => {
    const user = await createUser(uniqueNick());
    await expect(updateUser(user.id, { nickname: '!' })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns the updated UserRow from the database', async () => {
    const user = await createUser(uniqueNick());
    const newNick = uniqueNick('ReturnCheck');
    const updated = await updateUser(user.id, { nickname: newNick });

    expect(updated.id).toBe(user.id);
    expect(updated.nickname).toBe(newNick);
  });
});

// ===========================================================================
// updateUserStats
// ===========================================================================

describe('updateUserStats', () => {
  it('silently does nothing for a non-existent user', async () => {
    await expect(updateUserStats('ghost-id', '2026-04-01', true)).resolves.toBeUndefined();
  });

  it('increments games_played by 1', async () => {
    const user = await createUser(uniqueNick());
    await updateUserStats(user.id, '2026-04-01', true);
    const updated = await getUser(user.id)!;
    expect(updated!.games_played).toBe(1);
  });

  it('increments games_won when won is true', async () => {
    const user = await createUser(uniqueNick());
    await updateUserStats(user.id, '2026-04-01', true);
    const updated = await getUser(user.id)!;
    expect(updated!.games_won).toBe(1);
  });

  it('does NOT increment games_won when won is false', async () => {
    const user = await createUser(uniqueNick());
    await updateUserStats(user.id, '2026-04-01', false);
    const updated = await getUser(user.id)!;
    expect(updated!.games_won).toBe(0);
  });

  it('sets current_streak to 1 for the first win', async () => {
    const user = await createUser(uniqueNick());
    await updateUserStats(user.id, '2026-04-01', true);
    const updated = await getUser(user.id)!;
    expect(updated!.current_streak).toBe(1);
  });

  it('sets current_streak to 0 for the first loss', async () => {
    const user = await createUser(uniqueNick());
    await updateUserStats(user.id, '2026-04-01', false);
    const updated = await getUser(user.id)!;
    expect(updated!.current_streak).toBe(0);
  });

  it('increments streak on consecutive days (win then win)', async () => {
    const user = await createUser(uniqueNick());
    await updateUserStats(user.id, '2026-04-01', true);
    await updateUserStats(user.id, '2026-04-02', true);
    const updated = await getUser(user.id)!;
    expect(updated!.current_streak).toBe(2);
  });

  it('resets streak to 0 on loss after a winning streak', async () => {
    const user = await createUser(uniqueNick());
    await updateUserStats(user.id, '2026-04-01', true);
    await updateUserStats(user.id, '2026-04-02', true);
    await updateUserStats(user.id, '2026-04-03', false);
    const updated = await getUser(user.id)!;
    expect(updated!.current_streak).toBe(0);
  });

  it('resets streak to 1 for win after a gap in play', async () => {
    const user = await createUser(uniqueNick());
    await updateUserStats(user.id, '2026-04-01', true);
    await updateUserStats(user.id, '2026-04-02', true);
    // gap — skipping April 3
    await updateUserStats(user.id, '2026-04-04', true);
    const updated = await getUser(user.id)!;
    expect(updated!.current_streak).toBe(1);
  });

  it('is idempotent for the same date (does not double-count)', async () => {
    const user = await createUser(uniqueNick());
    await updateUserStats(user.id, '2026-04-01', true);
    await updateUserStats(user.id, '2026-04-01', true);
    const updated = await getUser(user.id)!;
    // games_played increments each call — streak should not grow
    expect(updated!.current_streak).toBe(1);
  });

  it('tracks best_streak as the highest current_streak seen', async () => {
    const user = await createUser(uniqueNick());
    await updateUserStats(user.id, '2026-04-01', true);
    await updateUserStats(user.id, '2026-04-02', true);
    await updateUserStats(user.id, '2026-04-03', true);
    // now lose and break streak
    await updateUserStats(user.id, '2026-04-04', false);

    const updated = await getUser(user.id)!;
    expect(updated!.best_streak).toBe(3);
    expect(updated!.current_streak).toBe(0);
  });

  it('updates last_played_date to the given date', async () => {
    const user = await createUser(uniqueNick());
    await updateUserStats(user.id, '2026-04-15', true);
    const updated = await getUser(user.id)!;
    expect(updated!.last_played_date).toBe('2026-04-15');
  });
});

// ===========================================================================
// toUserPublic
// ===========================================================================

describe('toUserPublic', () => {
  it('maps id, nickname, avatar, and createdAt correctly', async () => {
    const user = await createUser(uniqueNick('PublicMap'));
    const pub = toUserPublic(user);

    expect(pub.id).toBe(user.id);
    expect(pub.nickname).toBe(user.nickname);
    expect(pub.avatar).toBe(user.avatar);
    expect(pub.createdAt).toBe(user.created_at);
  });

  it('does NOT expose games_played or streak fields', async () => {
    const user = await createUser(uniqueNick('NoPrivate'));
    const pub = toUserPublic(user) as unknown as Record<string, unknown>;

    expect(Object.keys(pub)).not.toContain('games_played');
    expect(Object.keys(pub)).not.toContain('games_won');
    expect(Object.keys(pub)).not.toContain('current_streak');
    expect(Object.keys(pub)).not.toContain('best_streak');
    expect(Object.keys(pub)).not.toContain('last_played_date');
  });

  it('has exactly four keys', async () => {
    const user = await createUser(uniqueNick('FourKeys'));
    const pub = toUserPublic(user);
    expect(Object.keys(pub).length).toBe(4);
  });
});
