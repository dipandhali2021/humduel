/**
 * Unit tests for audioService.ts
 *
 * Mocking strategy:
 *   The `config.js` module is replaced so UPLOAD_DIR points at a temporary
 *   directory created via vi.hoisted() — before the mock factory runs.
 *   This is the only safe way to pass a runtime-created value into a vi.mock()
 *   factory under Vitest's hoisting semantics.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { vi, describe, it, expect, afterAll, beforeEach } from 'vitest';
import type { File as MulterFile } from 'multer';

// ---------------------------------------------------------------------------
// Create the temporary directory in vi.hoisted() so it exists before the
// mock factory for config.js executes.
// ---------------------------------------------------------------------------

const { tmpDir } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const os = require('os') as typeof import('os');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'humduel-audio-test-'));
  return { tmpDir: dir };
});

// ---------------------------------------------------------------------------
// Mock the config module BEFORE importing the service.
// ---------------------------------------------------------------------------

vi.mock('../../config.js', () => ({
  UPLOAD_DIR: tmpDir,
  NODE_ENV: 'test',
  PORT: 3001,
  DATABASE_PATH: ':memory:',
  CORS_ORIGIN: '*',
  requireEnv: (_key: string, fallback?: string) => fallback ?? '',
}));

// ---------------------------------------------------------------------------
// Import the service after the mock is registered.
// ---------------------------------------------------------------------------

const { saveAudioFile, ensureUploadDir } = await import('../../services/audioService.js');

// ---------------------------------------------------------------------------
// Teardown
// ---------------------------------------------------------------------------

afterAll(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal Express.Multer.File-shaped object.
 */
function makeFile(overrides: Partial<MulterFile> = {}): Express.Multer.File {
  return {
    fieldname: 'audio',
    originalname: 'recording.webm',
    encoding: '7bit',
    mimetype: 'audio/webm',
    size: 1024, // 1 KB – well within the 500 KB limit
    buffer: Buffer.from('fake audio data'),
    destination: '',
    filename: '',
    path: '',
    stream: null as unknown as NodeJS.ReadableStream,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// ensureUploadDir
// ---------------------------------------------------------------------------

describe('ensureUploadDir', () => {
  it('does not throw when the directory already exists', () => {
    // tmpDir exists, so this is a no-op that should not throw.
    expect(() => ensureUploadDir()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// saveAudioFile – MIME type validation
// ---------------------------------------------------------------------------

describe('saveAudioFile – MIME type validation', () => {
  it('accepts audio/webm', () => {
    const file = makeFile({ mimetype: 'audio/webm' });
    expect(() => saveAudioFile(file, 'mime-webm')).not.toThrow();
  });

  it('accepts audio/ogg', () => {
    const file = makeFile({ mimetype: 'audio/ogg' });
    expect(() => saveAudioFile(file, 'mime-ogg')).not.toThrow();
  });

  it('accepts audio/mp4', () => {
    const file = makeFile({ mimetype: 'audio/mp4' });
    expect(() => saveAudioFile(file, 'mime-mp4')).not.toThrow();
  });

  it('rejects audio/mpeg', () => {
    const file = makeFile({ mimetype: 'audio/mpeg' });
    expect(() => saveAudioFile(file, 'mime-mpeg')).toThrow(/Unsupported audio format/);
  });

  it('rejects video/mp4', () => {
    const file = makeFile({ mimetype: 'video/mp4' });
    expect(() => saveAudioFile(file, 'mime-video-mp4')).toThrow(/Unsupported audio format/);
  });

  it('rejects application/octet-stream', () => {
    const file = makeFile({ mimetype: 'application/octet-stream' });
    expect(() => saveAudioFile(file, 'mime-octet')).toThrow(/Unsupported audio format/);
  });

  it('rejects an empty mimetype string', () => {
    const file = makeFile({ mimetype: '' });
    expect(() => saveAudioFile(file, 'mime-empty')).toThrow(/Unsupported audio format/);
  });

  it('error message includes the rejected MIME type', () => {
    const file = makeFile({ mimetype: 'audio/flac' });
    let caughtError: unknown;
    try {
      saveAudioFile(file, 'mime-flac');
    } catch (err) {
      caughtError = err;
    }
    expect(caughtError).toBeDefined();
    expect((caughtError as Error).message).toContain('audio/flac');
  });
});

// ---------------------------------------------------------------------------
// saveAudioFile – file size validation
// ---------------------------------------------------------------------------

describe('saveAudioFile – file size validation', () => {
  it('accepts a file exactly at 500 KB', () => {
    const buf = Buffer.alloc(500 * 1024);
    const file = makeFile({ size: buf.length, buffer: buf });
    expect(() => saveAudioFile(file, 'size-exactly-500kb')).not.toThrow();
  });

  it('accepts a file well under 500 KB', () => {
    const buf = Buffer.alloc(1024);
    const file = makeFile({ size: buf.length, buffer: buf });
    expect(() => saveAudioFile(file, 'size-1kb')).not.toThrow();
  });

  it('rejects a file that is 1 byte over 500 KB', () => {
    const overLimit = 500 * 1024 + 1;
    const file = makeFile({ size: overLimit, buffer: Buffer.alloc(overLimit) });
    expect(() => saveAudioFile(file, 'size-over-limit')).toThrow(/too large/);
  });

  it('rejects a file at 1 MB', () => {
    const oneMB = 1024 * 1024;
    const file = makeFile({ size: oneMB, buffer: Buffer.alloc(oneMB) });
    expect(() => saveAudioFile(file, 'size-1mb')).toThrow(/too large/);
  });

  it('error message includes the actual file size in bytes', () => {
    const overLimit = 600 * 1024;
    const file = makeFile({ size: overLimit, buffer: Buffer.alloc(overLimit) });
    let caughtError: unknown;
    try {
      saveAudioFile(file, 'size-error-msg');
    } catch (err) {
      caughtError = err;
    }
    expect(caughtError).toBeDefined();
    expect((caughtError as Error).message).toContain(String(overLimit));
  });
});

// ---------------------------------------------------------------------------
// saveAudioFile – successful file saves
// ---------------------------------------------------------------------------

describe('saveAudioFile – successful file saves', () => {
  // Remove any files written during the previous test so assertions are clean.
  beforeEach(() => {
    for (const entry of fs.readdirSync(tmpDir)) {
      const full = path.join(tmpDir, entry);
      if (fs.statSync(full).isFile()) {
        fs.unlinkSync(full);
      }
    }
  });

  it('returns the correct filename format "<challengeId>.webm"', () => {
    const filename = saveAudioFile(makeFile(), 'challenge-abc');
    expect(filename).toBe('challenge-abc.webm');
  });

  it('always appends the .webm extension regardless of the source MIME type', () => {
    // Even when the uploaded file is audio/ogg, the stored filename uses .webm.
    const file = makeFile({ mimetype: 'audio/ogg' });
    const filename = saveAudioFile(file, 'challenge-ogg');
    expect(filename).toBe('challenge-ogg.webm');
  });

  it('writes the file to the upload directory', () => {
    const challengeId = 'ch-persist-test';
    saveAudioFile(makeFile({ buffer: Buffer.from('audio content here') }), challengeId);

    const expectedPath = path.join(tmpDir, `${challengeId}.webm`);
    expect(fs.existsSync(expectedPath)).toBe(true);
  });

  it('writes the exact buffer content to disk', () => {
    const content = Buffer.from('precise audio bytes 12345');
    const challengeId = 'ch-content-check';
    saveAudioFile(makeFile({ buffer: content, size: content.length }), challengeId);

    const written = fs.readFileSync(path.join(tmpDir, `${challengeId}.webm`));
    expect(written.equals(content)).toBe(true);
  });

  it('overwrites an existing file with the same challengeId', () => {
    const challengeId = 'ch-overwrite';
    const first = Buffer.from('first version');
    const second = Buffer.from('second version');

    saveAudioFile(makeFile({ buffer: first, size: first.length }), challengeId);
    saveAudioFile(makeFile({ buffer: second, size: second.length }), challengeId);

    const written = fs.readFileSync(path.join(tmpDir, `${challengeId}.webm`));
    expect(written.equals(second)).toBe(true);
  });

  it('writes multiple files with different challenge ids', () => {
    saveAudioFile(makeFile(), 'multi-ch-1');
    saveAudioFile(makeFile(), 'multi-ch-2');
    saveAudioFile(makeFile(), 'multi-ch-3');

    expect(fs.existsSync(path.join(tmpDir, 'multi-ch-1.webm'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'multi-ch-2.webm'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'multi-ch-3.webm'))).toBe(true);
  });
});
