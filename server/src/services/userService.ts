import { nanoid } from 'nanoid';
import { getDb } from '../database.js';
import type { AppError } from '../middleware/errorHandler.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserRow {
  id: string;
  nickname: string;
  avatar: string;
  games_played: number;
  games_won: number;
  current_streak: number;
  best_streak: number;
  last_played_date: string | null;
  created_at: string;
}

export interface UserPublic {
  id: string;
  nickname: string;
  avatar: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NICKNAME_REGEX = /^[a-zA-Z0-9 ]{2,20}$/;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateNickname(nickname: string): void {
  if (!NICKNAME_REGEX.test(nickname)) {
    const err = new Error(
      'Nickname must be 2–20 characters and contain only letters, numbers, and spaces',
    ) as AppError;
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }
}

function makeOperationalError(message: string, statusCode: number): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Return the ISO date string (YYYY-MM-DD) for the day immediately before the
 * given date string. Both input and output are in UTC.
 */
function yesterdayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Create a new user with a generated 12-character id.
 * Throws a 400 AppError if the nickname is invalid.
 * Throws a 409 AppError if the nickname is already taken.
 */
export async function createUser(nickname: string): Promise<UserRow> {
  const db = await getDb();
  const trimmed = nickname.trim();
  validateNickname(trimmed);

  const existing = await db.get<UserRow>('SELECT * FROM users WHERE nickname = $1', [trimmed]);
  if (existing) {
    throw makeOperationalError('Nickname is already taken', 409);
  }

  const id = nanoid(12);
  const now = new Date().toISOString();

  await db.run(
    `INSERT INTO users (id, nickname, avatar, created_at)
     VALUES ($1, $2, $3, $4)`,
    [id, trimmed, 'default', now]
  );

  const user = await db.get<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return user!;
}

/**
 * Retrieve a user by their ID.
 * Returns null if no matching user exists.
 */
export async function getUser(id: string): Promise<UserRow | null> {
  const db = await getDb();
  return db.get<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
}

/**
 * Retrieve a user by their nickname.
 * Returns null if no matching user exists.
 */
export async function getUserByNickname(nickname: string): Promise<UserRow | null> {
  const db = await getDb();
  return db.get<UserRow>('SELECT * FROM users WHERE nickname = $1', [nickname]);
}

/**
 * Update a user's mutable fields (nickname and/or avatar).
 * Throws a 404 AppError if the user does not exist.
 * Throws a 400 AppError if the new nickname is invalid.
 * Throws a 409 AppError if the new nickname is already taken by another user.
 */
export async function updateUser(
  id: string,
  data: { nickname?: string; avatar?: string },
): Promise<UserRow> {
  const db = await getDb();
  const current = await db.get<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  if (!current) {
    throw makeOperationalError('User not found', 404);
  }

  const { nickname, avatar } = data;

  if (nickname !== undefined) {
    const trimmed = nickname.trim();
    validateNickname(trimmed);

    const conflict = await db.get<UserRow>('SELECT * FROM users WHERE nickname = $1', [trimmed]);
    if (conflict && conflict.id !== id) {
      throw makeOperationalError('Nickname is already taken', 409);
    }

    if (avatar !== undefined) {
      await db.run(
        'UPDATE users SET nickname = $1, avatar = $2 WHERE id = $3',
        [trimmed, avatar.trim(), id]
      );
    } else {
      await db.run(
        'UPDATE users SET nickname = $1 WHERE id = $2',
        [trimmed, id]
      );
    }
  } else if (avatar !== undefined) {
    await db.run(
      'UPDATE users SET avatar = $1 WHERE id = $2',
      [avatar.trim(), id]
    );
  }

  const updated = await db.get<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return updated!;
}

/**
 * Update games_played, games_won, current_streak, best_streak, and
 * last_played_date for the given user after completing a game.
 *
 * Streak logic (based on `date`, expected format YYYY-MM-DD):
 *   - If last_played_date is yesterday  → increment current_streak
 *   - If last_played_date is today      → no streak change (idempotent replay)
 *   - Otherwise                         → reset to 1 (won) or 0 (lost)
 *
 * Silently does nothing if the user does not exist.
 */
export async function updateUserStats(userId: string, date: string, won: boolean): Promise<void> {
  const db = await getDb();
  const current = await db.get<UserRow>('SELECT * FROM users WHERE id = $1', [userId]);
  if (!current) return;

  const newGamesPlayed = current.games_played + 1;
  const newGamesWon = won ? current.games_won + 1 : current.games_won;

  const lastDate = current.last_played_date;
  let newStreak: number;

  if (lastDate === null) {
    // First game ever
    newStreak = won ? 1 : 0;
  } else if (lastDate === date) {
    // Same day replay — preserve the existing streak without double-counting
    newStreak = current.current_streak;
  } else if (yesterdayOf(date) === lastDate) {
    // Consecutive day
    newStreak = won ? current.current_streak + 1 : 0;
  } else {
    // Gap in play
    newStreak = won ? 1 : 0;
  }

  const newBestStreak = Math.max(current.best_streak, newStreak);

  await db.run(
    `UPDATE users
     SET games_played = $1,
         games_won = $2,
         current_streak = $3,
         best_streak = $4,
         last_played_date = $5
     WHERE id = $6`,
    [newGamesPlayed, newGamesWon, newStreak, newBestStreak, date, userId]
  );
}

// ---------------------------------------------------------------------------
// Projection helper
// ---------------------------------------------------------------------------

/**
 * Strip private fields from a UserRow to produce a UserPublic shape.
 */
export function toUserPublic(row: UserRow): UserPublic {
  return {
    id: row.id,
    nickname: row.nickname,
    avatar: row.avatar,
    createdAt: row.created_at,
  };
}
