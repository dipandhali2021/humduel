/**
 * Database module with conditional backend selection.
 * 
 * - PostgreSQL (async): when DATABASE_URL is set (production/Vercel)
 * - SQLite (sync): when DATABASE_URL is not set (local development)
 * 
 * All service code should use the async API exported from this module.
 */

import { DATABASE_PATH } from './config.js';

const USE_POSTGRES = !!process.env.DATABASE_URL;

// ---------------------------------------------------------------------------
// Types for the async database interface
// ---------------------------------------------------------------------------

export interface AsyncDatabase {
  /**
   * Execute a query and return all rows.
   */
  all<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  
  /**
   * Execute a query and return the first row, or null.
   */
  get<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;
  
  /**
   * Execute a query that modifies data (INSERT, UPDATE, DELETE).
   * Returns an object with changes count and lastInsertRowid.
   */
  run(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowid: number | bigint }>;
  
  /**
   * Execute multiple SQL statements (for schema init).
   */
  exec(sql: string): Promise<void>;
  
  /**
   * Close connections (for graceful shutdown).
   */
  close(): Promise<void>;
}

// ---------------------------------------------------------------------------
// PostgreSQL implementation
// ---------------------------------------------------------------------------

async function createPostgresDatabase(): Promise<AsyncDatabase> {
  const { getPool, initSchema, closePool } = await import('./database-pg.js');
  
  // Initialize schema on first connection
  await initSchema();
  
  return {
    async all<T>(sql: string, params?: unknown[]): Promise<T[]> {
      const pool = getPool();
      const result = await pool.query(sql, params);
      return result.rows as T[];
    },
    
    async get<T>(sql: string, params?: unknown[]): Promise<T | null> {
      const pool = getPool();
      const result = await pool.query(sql, params);
      return (result.rows[0] as T) ?? null;
    },
    
    async run(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowid: number | bigint }> {
      const pool = getPool();
      const result = await pool.query(sql, params);
      // PostgreSQL returns rowCount for changes
      // For INSERT with RETURNING, we'd need to modify the query
      // For now, use a simple heuristic
      const changes = result.rowCount ?? 0;
      // lastInsertRowid - PostgreSQL uses SERIAL, need to use RETURNING id
      // This is a simplified version; complex cases may need adjustment
      const lastInsertRowid = result.rows[0]?.id ?? 0;
      return { changes, lastInsertRowid };
    },
    
    async exec(sql: string): Promise<void> {
      const pool = getPool();
      await pool.query(sql);
    },
    
    async close(): Promise<void> {
      await closePool();
    },
  };
}

// ---------------------------------------------------------------------------
// Parameter conversion: PostgreSQL $1, $2, ... to SQLite ?, ?, ...
// ---------------------------------------------------------------------------

/**
 * Convert PostgreSQL-style parameters ($1, $2, ...) to SQLite-style (?).
 * Also reorders the params array to match the order of $n references.
 */
function convertToSqlite(sql: string, params?: unknown[]): { sql: string; params: unknown[] } {
  if (!params || params.length === 0) {
    // No params - just replace any $N with ? (though there shouldn't be any)
    return { sql: sql.replace(/\$\d+/g, '?'), params: [] };
  }
  
  // Find all $N references in order
  const matches = sql.match(/\$(\d+)/g);
  if (!matches) {
    return { sql, params: params || [] };
  }
  
  // Build new params array based on $N order
  // $1 -> index 0, $2 -> index 1, etc.
  const newParams: unknown[] = [];
  let newSql = sql;
  
  for (const match of matches) {
    const num = parseInt(match.slice(1), 10);
    if (num >= 1 && num <= params.length) {
      newParams.push(params[num - 1]);
    }
  }
  
  // Replace all $N with ?
  newSql = sql.replace(/\$\d+/g, '?');
  
  return { sql: newSql, params: newParams };
}

// ---------------------------------------------------------------------------
// SQLite implementation (wraps better-sqlite3 in async API)
// ---------------------------------------------------------------------------

interface SQLiteDatabase {
  prepare: (sql: string) => {
    run: (params?: unknown[]) => { changes: number; lastInsertRowid: number | bigint };
    get: <T>(params?: unknown[]) => T | undefined;
    all: <T>(params?: unknown[]) => T[];
  };
  exec: (sql: string) => void;
  pragma: (sql: string) => unknown[];
  close: () => void;
}

async function createSqliteDatabase(): Promise<AsyncDatabase> {
  const Database = (await import('better-sqlite3')).default;
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  
  // Ensure the data directory exists
  const dataDir = path.dirname(DATABASE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const db = new Database(DATABASE_PATH) as SQLiteDatabase;
  
  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  // Read and execute schema DDL
  const schemaPath = path.resolve(__dirname, 'db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  
  // Run migrations
  function columnExists(table: string, column: string): boolean {
    const rows = db.pragma(`table_info(${table})`) as Array<{ name: string }>;
    return rows.some((r) => r.name === column);
  }
  
  function addColumnIfMissing(table: string, column: string, definition: string): void {
    if (!columnExists(table, column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
  
  // Sprint 3 migration
  if (columnExists('daily_challenges', 'audio_filename')) {
    db.exec(`
      ALTER TABLE daily_challenges RENAME TO daily_challenges_old;
  
      CREATE TABLE daily_challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        puzzle_number INTEGER NOT NULL,
        song_title TEXT NOT NULL,
        song_artist TEXT NOT NULL,
        song_id TEXT,
        spotify_preview_url TEXT,
        spotify_album_art TEXT
      );
  
      INSERT INTO daily_challenges
        (id, date, puzzle_number, song_title, song_artist, song_id)
      SELECT
        id, date, puzzle_number, song_title, song_artist, song_id
      FROM daily_challenges_old;
  
      DROP TABLE daily_challenges_old;
    `);
  }
  
  // Add columns
  addColumnIfMissing('users', 'nickname', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing('users', 'avatar', "TEXT DEFAULT 'default'");
  addColumnIfMissing('users', 'last_played_date', 'TEXT');
  
  return {
    async all<T>(sql: string, params?: unknown[]): Promise<T[]> {
      const { sql: convertedSql, params: convertedParams } = convertToSqlite(sql, params);
      return db.prepare(convertedSql).all<T>(convertedParams);
    },
    
    async get<T>(sql: string, params?: unknown[]): Promise<T | null> {
      const { sql: convertedSql, params: convertedParams } = convertToSqlite(sql, params);
      return db.prepare(convertedSql).get<T>(convertedParams) ?? null;
    },
    
    async run(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowid: number | bigint }> {
      const { sql: convertedSql, params: convertedParams } = convertToSqlite(sql, params);
      return db.prepare(convertedSql).run(convertedParams);
    },
    
    async exec(sql: string): Promise<void> {
      db.exec(sql);
    },
    
    async close(): Promise<void> {
      db.close();
    },
  };
}

// ---------------------------------------------------------------------------
// Export the appropriate database instance
// ---------------------------------------------------------------------------

let _db: AsyncDatabase | null = null;
let _dbPromise: Promise<AsyncDatabase> | null = null;

/**
 * Get the database instance (async).
 * 
 * Returns a PostgreSQL connection when DATABASE_URL is set,
 * otherwise returns a SQLite connection for local development.
 */
export async function getDb(): Promise<AsyncDatabase> {
  if (_db) return _db;
  
  // Prevent concurrent initialization
  if (_dbPromise) return _dbPromise;
  
  _dbPromise = USE_POSTGRES ? createPostgresDatabase() : createSqliteDatabase();
  _db = await _dbPromise;
  return _db;
}

/**
 * Close the database connection.
 */
export async function closeDb(): Promise<void> {
  if (_db) {
    await _db.close();
    _db = null;
    _dbPromise = null;
  }
}

// Export configuration flag
export const isPostgres = USE_POSTGRES;
