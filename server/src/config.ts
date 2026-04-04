import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root (server parent directory)
config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const NODE_ENV = process.env['NODE_ENV'] ?? 'development';
export const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
export const DATABASE_PATH = process.env['DATABASE_PATH'] ?? path.resolve(__dirname, '../../data/humduel.db');
export const UPLOAD_DIR = process.env['UPLOAD_DIR'] ?? path.resolve(__dirname, '../../uploads');
export const CORS_ORIGIN = process.env['CORS_ORIGIN'] ?? 'http://localhost:5173';

// Re-export requireEnv in case routes need it
export { requireEnv };
