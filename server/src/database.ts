import Database, { type Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DATABASE_PATH } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure the data directory exists before opening the DB file
const dataDir = path.dirname(DATABASE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db: DatabaseType = new Database(DATABASE_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Read and execute schema DDL
const schemaPath = path.resolve(__dirname, 'db/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

// ---------------------------------------------------------------------------
// Incremental migrations
// SQLite's CREATE TABLE IF NOT EXISTS won't alter existing tables, so columns
// added after initial schema creation must be applied here.  We guard each
// ALTER TABLE by checking PRAGMA table_info first so the migration is
// idempotent and safe to run on every startup.
// ---------------------------------------------------------------------------

function columnExists(table: string, column: string): boolean {
  const rows = db.pragma(`table_info(${table})`) as Array<{ name: string }>;
  return rows.some((r) => r.name === column);
}

function addColumnIfMissing(table: string, column: string, definition: string): void {
  if (!columnExists(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// ---------------------------------------------------------------------------
// Sprint 3 migration: rebuild daily_challenges with the current schema.
//
// The original table included audio_filename and waveform_data columns with
// NOT NULL constraints that are incompatible with the daily challenge model.
// If those columns still exist we recreate the table (it starts empty, so no
// data is lost).  The recreation uses the rename-create-insert-drop pattern
// which is the SQLite-recommended way to change column constraints.
// ---------------------------------------------------------------------------

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

// Sprint 3: users table — add columns introduced after initial schema creation
addColumnIfMissing('users', 'nickname', "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('users', 'avatar', "TEXT DEFAULT 'default'");
addColumnIfMissing('users', 'last_played_date', 'TEXT');

export default db;
