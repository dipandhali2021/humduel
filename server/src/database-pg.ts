/**
 * PostgreSQL database module for Vercel serverless deployment.
 * 
 * Uses the `pg` package with connection pooling via DATABASE_URL.
 * All methods are async since PostgreSQL requires async I/O.
 */

import pg, { type Pool, type PoolClient, type QueryResult } from 'pg';

const { Pool: PgPool } = pg;

// PostgreSQL connection pool singleton
let pool: Pool | null = null;
let schemaInitialized = false;

/**
 * Get the PostgreSQL connection pool, creating it if necessary.
 */
export function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
    }

    pool = new PgPool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('neon.tech') || databaseUrl.includes('sslmode=require')
        ? { rejectUnauthorized: true }
        : false,
      // Connection pool settings for serverless
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
    });
  }
  return pool;
}

// ---------------------------------------------------------------------------
// Schema SQL
// ---------------------------------------------------------------------------

const SCHEMA_SQL = `
-- Challenges table (user-created challenges)
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  creator_name TEXT NOT NULL DEFAULT 'Anonymous',
  audio_filename TEXT NOT NULL,
  waveform_data TEXT NOT NULL,
  song_title TEXT NOT NULL,
  song_artist TEXT NOT NULL,
  song_id TEXT,
  duration_seconds REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
  expires_at TEXT NOT NULL
);

-- Guesses for regular challenges
CREATE TABLE IF NOT EXISTS guesses (
  id SERIAL PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES challenges(id),
  guesser_name TEXT DEFAULT 'Anonymous',
  song_title TEXT NOT NULL,
  song_artist TEXT NOT NULL,
  correct INTEGER NOT NULL DEFAULT 0,
  attempt_number INTEGER NOT NULL,
  time_ms INTEGER,
  session_id TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
);

-- Daily challenges (one per day)
CREATE TABLE IF NOT EXISTS daily_challenges (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  puzzle_number INTEGER NOT NULL,
  song_title TEXT NOT NULL,
  song_artist TEXT NOT NULL,
  song_id TEXT,
  spotify_preview_url TEXT,
  spotify_album_art TEXT
);

-- Daily guesses
CREATE TABLE IF NOT EXISTS daily_guesses (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT NOT NULL,
  guess_text TEXT NOT NULL,
  correct INTEGER NOT NULL DEFAULT 0,
  attempt_number INTEGER NOT NULL,
  time_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nickname TEXT UNIQUE NOT NULL,
  avatar TEXT DEFAULT 'default',
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_played_date TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_guesses_session ON guesses(challenge_id, session_id);
CREATE INDEX IF NOT EXISTS idx_daily_guesses_date ON daily_guesses(date, session_id);
CREATE INDEX IF NOT EXISTS idx_daily_guesses_user ON daily_guesses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date);
`.trim();

/**
 * Initialize the database schema.
 * Safe to call multiple times (uses IF NOT EXISTS).
 */
export async function initSchema(): Promise<void> {
  const pool = getPool();
  const statements = SCHEMA_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const sql of statements) {
    await pool.query(sql);
  }
  schemaInitialized = true;
}

/**
 * Ensure schema is initialized before running queries.
 */
async function ensureSchema(): Promise<void> {
  if (!schemaInitialized) {
    await initSchema();
  }
}

/**
 * Execute a query with parameters and return all rows.
 */
export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

/**
 * Execute a query and return the first row, or null if no rows.
 */
export async function queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Execute a query and return the result (including row count, insert id, etc).
 */
export async function execute(sql: string, params?: unknown[]): Promise<QueryResult> {
  await ensureSchema();
  const pool = getPool();
  return pool.query(sql, params);
}

/**
 * Execute a query within a transaction.
 * Pass a callback that receives a client and returns a promise.
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  await ensureSchema();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the connection pool (for graceful shutdown).
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    schemaInitialized = false;
  }
}

// Re-export types
export type { Pool, PoolClient, QueryResult };
