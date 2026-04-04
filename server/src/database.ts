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

export default db;
