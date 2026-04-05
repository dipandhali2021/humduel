import fs from 'fs';
import path from 'path';
import { UPLOAD_DIR } from '../config.js';

const ALLOWED_MIME_TYPES = new Set(['audio/webm', 'audio/ogg', 'audio/mp4']);
const MAX_FILE_SIZE_BYTES = 500 * 1024; // 500 KB

/**
 * Ensure the uploads directory exists. Safe to call multiple times.
 */
export function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Validate and persist an uploaded audio file.
 * Returns the stored filename (e.g. "<challengeId>.webm").
 * Throws an Error with a descriptive message if validation fails.
 */
export function saveAudioFile(
  file: Express.Multer.File,
  challengeId: string,
): string {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new Error(
      `Unsupported audio format "${file.mimetype}". Allowed: audio/webm, audio/ogg, audio/mp4.`,
    );
  }

  // Validate file size (multer memory storage populates file.size)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Audio file too large (${file.size} bytes). Maximum allowed size is 500 KB.`,
    );
  }

  ensureUploadDir();

  const filename = `${challengeId}.webm`;
  const dest = path.join(UPLOAD_DIR, filename);

  fs.writeFileSync(dest, file.buffer);

  return filename;
}
