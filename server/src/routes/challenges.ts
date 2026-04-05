import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';

import { uploadLimiter } from '../middleware/rateLimiter.js';
import { sendValidationError } from '../middleware/validate.js';
import type { AppError } from '../middleware/errorHandler.js';
import { saveAudioFile } from '../services/audioService.js';
import {
  createChallengeWithId,
  getChallenge,
  submitGuess,
  getResult,
} from '../services/challengeService.js';

// ---------------------------------------------------------------------------
// Multer — memory storage, 500 KB cap
// ---------------------------------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 },
});

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/challenges
// Create a new challenge with an audio recording.
// ---------------------------------------------------------------------------

router.post(
  '/',
  uploadLimiter,
  upload.single('audio'),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      // ---- File presence ----
      if (!req.file) {
        sendValidationError(res, [{ field: 'audio', message: '"audio" file is required' }]);
        return;
      }

      // ---- Required text fields ----
      const body = req.body as Record<string, string | undefined>;
      const { songTitle, songArtist, durationSeconds, waveformData, creatorAlias } = body;

      const details: { field: string; message: string }[] = [];

      if (!songTitle?.trim()) {
        details.push({ field: 'songTitle', message: '"songTitle" is required' });
      }
      if (!songArtist?.trim()) {
        details.push({ field: 'songArtist', message: '"songArtist" is required' });
      }
      if (
        durationSeconds === undefined ||
        durationSeconds === null ||
        String(durationSeconds).trim() === ''
      ) {
        details.push({ field: 'durationSeconds', message: '"durationSeconds" is required' });
      }
      if (!waveformData?.trim()) {
        details.push({ field: 'waveformData', message: '"waveformData" is required' });
      }

      if (details.length > 0) {
        sendValidationError(res, details);
        return;
      }

      // ---- Parse waveformData ----
      let parsedWaveform: number[];
      try {
        parsedWaveform = JSON.parse(waveformData as string) as number[];
      } catch {
        sendValidationError(res, [
          { field: 'waveformData', message: '"waveformData" must be a valid JSON array' },
        ]);
        return;
      }

      if (!Array.isArray(parsedWaveform) || parsedWaveform.length !== 200) {
        sendValidationError(res, [
          {
            field: 'waveformData',
            message: '"waveformData" must be a JSON array of exactly 200 numbers',
          },
        ]);
        return;
      }

      // ---- Parse durationSeconds ----
      const durationNum = parseFloat(durationSeconds as string);
      if (isNaN(durationNum) || durationNum < 0) {
        sendValidationError(res, [
          {
            field: 'durationSeconds',
            message: '"durationSeconds" must be a non-negative number',
          },
        ]);
        return;
      }

      // ---- Generate id up-front so the audio filename matches the DB row ----
      const challengeId = nanoid(8);

      // ---- Save audio file (validates MIME and size) ----
      let audioFilename: string;
      try {
        audioFilename = saveAudioFile(req.file, challengeId);
      } catch (audioErr) {
        const msg = audioErr instanceof Error ? audioErr.message : 'Audio file save failed';
        sendValidationError(res, [{ field: 'audio', message: msg }]);
        return;
      }

      // ---- Persist challenge ----
      const result = createChallengeWithId(challengeId, {
        audioFilename,
        waveformData: parsedWaveform,
        songTitle: (songTitle as string).trim(),
        songArtist: (songArtist as string).trim(),
        durationSeconds: durationNum,
        creatorAlias: creatorAlias?.trim(),
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// GET /api/challenges/:id
// Retrieve a challenge (without the song answer).
// ---------------------------------------------------------------------------

router.get('/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params as { id: string };
    const challenge = getChallenge(id);

    if (!challenge) {
      const err: AppError = new Error('Challenge not found');
      err.statusCode = 404;
      err.isOperational = true;
      next(err);
      return;
    }

    if (new Date(challenge.expiresAt) < new Date()) {
      res.status(410).json({
        error: 'Challenge has expired',
        code: 'CHALLENGE_EXPIRED',
      });
      return;
    }

    res.json(challenge);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/challenges/:id/guess
// Submit a guess for a challenge.
// ---------------------------------------------------------------------------

router.post('/:id/guess', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;

    const guessText = body['guess'];
    if (typeof guessText !== 'string' || guessText.trim() === '') {
      sendValidationError(res, [
        {
          field: 'guess',
          message: '"guess" is required and must be a non-empty string',
        },
      ]);
      return;
    }

    const sessionId =
      typeof body['sessionId'] === 'string' && body['sessionId'].trim() !== ''
        ? body['sessionId'].trim()
        : undefined;

    const result = submitGuess(id, guessText.trim(), sessionId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/challenges/:id/result
// Get the completed result for a session.
// ---------------------------------------------------------------------------

router.get('/:id/result', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params as { id: string };
    const sessionId =
      typeof req.query['sessionId'] === 'string' ? req.query['sessionId'].trim() : '';

    if (!sessionId) {
      sendValidationError(res, [
        { field: 'sessionId', message: '"sessionId" query parameter is required' },
      ]);
      return;
    }

    const result = getResult(id, sessionId);

    if (!result) {
      res.status(404).json({
        error: 'No result found for this challenge and session',
        code: 'RESULT_NOT_FOUND',
      });
      return;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
