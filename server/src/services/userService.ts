import { nanoid } from 'nanoid';
import db from '../database.js';
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
// Database prepared statements
// ---------------------------------------------------------------------------

const stmtInsertUser = db.prepare<{
  id: string;
  nickname: string;
  avatar: string;
  created_at: string;
}>(`
  INSERT INTO users (id, nickname, avatar, created_at)
  VALUES (@id, @nickname, @avatar, @created_at)
`);

const stmtSelectUserById = db.prepare<[string]>('SELECT * FROM users WHERE id = ?');

const stmtSelectUserByNickname = db.prepare<[string]>('SELECT * FROM users WHERE nickname = ?');

const stmtUpdateUserNicknameAndAvatar = db.prepare<{
  nickname: string;
  avatar: string;
  id: string;
}>(`
  UPDATE users SET nickname = @nickname, avatar = @avatar WHERE id = @id
`);

const stmtUpdateUserNickname = db.prepare<{ nickname: string; id: string }>(
  'UPDATE users SET nickname = @nickname WHERE id = @id',
);

const stmtUpdateUserAvatar = db.prepare<{ avatar: string; id: string }>(
  'UPDATE users SET avatar = @avatar WHERE id = @id',
);

const stmtUpdateUserStats = db.prepare<{
  games_played: number;
  games_won: number;
  current_streak: number;
  best_streak: number;
  last_played_date: string;
  id: string;
}>(`
  UPDATE users
  SET games_played = @games_played,
      games_won     = @games_won,
      current_streak = @current_streak,
      best_streak   = @best_streak,
      last_played_date = @last_played_date
  WHERE id = @id
`);

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
export function createUser(nickname: string): UserRow {
  const trimmed = nickname.trim();
  validateNickname(trimmed);

  const existing = stmtSelectUserByNickname.get(trimmed) as UserRow | undefined;
  if (existing) {
    throw makeOperationalError('Nickname is already taken', 409);
  }

  const id = nanoid(12);
  const now = new Date().toISOString();

  stmtInsertUser.run({ id, nickname: trimmed, avatar: 'default', created_at: now });

  return stmtSelectUserById.get(id) as UserRow;
}

/**
 * Retrieve a user by their ID.
 * Returns null if no matching user exists.
 */
export function getUser(id: string): UserRow | null {
  const row = stmtSelectUserById.get(id) as UserRow | undefined;
  return row ?? null;
}

/**
 * Retrieve a user by their nickname.
 * Returns null if no matching user exists.
 */
export function getUserByNickname(nickname: string): UserRow | null {
  const row = stmtSelectUserByNickname.get(nickname) as UserRow | undefined;
  return row ?? null;
}

/**
 * Update a user's mutable fields (nickname and/or avatar).
 * Throws a 404 AppError if the user does not exist.
 * Throws a 400 AppError if the new nickname is invalid.
 * Throws a 409 AppError if the new nickname is already taken by another user.
 */
export function updateUser(
  id: string,
  data: { nickname?: string; avatar?: string },
): UserRow {
  const current = stmtSelectUserById.get(id) as UserRow | undefined;
  if (!current) {
    throw makeOperationalError('User not found', 404);
  }

  const { nickname, avatar } = data;

  if (nickname !== undefined) {
    const trimmed = nickname.trim();
    validateNickname(trimmed);

    const conflict = stmtSelectUserByNickname.get(trimmed) as UserRow | undefined;
    if (conflict && conflict.id !== id) {
      throw makeOperationalError('Nickname is already taken', 409);
    }

    if (avatar !== undefined) {
      stmtUpdateUserNicknameAndAvatar.run({ nickname: trimmed, avatar: avatar.trim(), id });
    } else {
      stmtUpdateUserNickname.run({ nickname: trimmed, id });
    }
  } else if (avatar !== undefined) {
    stmtUpdateUserAvatar.run({ avatar: avatar.trim(), id });
  }

  return stmtSelectUserById.get(id) as UserRow;
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
export function updateUserStats(userId: string, date: string, won: boolean): void {
  const current = stmtSelectUserById.get(userId) as UserRow | undefined;
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

  stmtUpdateUserStats.run({
    games_played: newGamesPlayed,
    games_won: newGamesWon,
    current_streak: newStreak,
    best_streak: newBestStreak,
    last_played_date: date,
    id: userId,
  });
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
