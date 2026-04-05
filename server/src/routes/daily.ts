import { Router, type Request, type Response, type NextFunction } from 'express';

import { sendValidationError } from '../middleware/validate.js';
import {
  getDailyChallenge,
  submitDailyGuess,
  getDailyResult,
  getTodayDate,
} from '../services/dailyService.js';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/daily
// Return today's challenge state for the given session (no song answer).
// Query params: sessionId (required)
// ---------------------------------------------------------------------------

router.get('/', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const sessionId =
      typeof req.query['sessionId'] === 'string' ? req.query['sessionId'].trim() : '';

    if (!sessionId) {
      sendValidationError(res, [
        { field: 'sessionId', message: '"sessionId" query parameter is required' },
      ]);
      return;
    }

    const today = getTodayDate();
    const challenge = getDailyChallenge(today, sessionId);
    res.json(challenge);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/daily/guess
// Submit a guess for today's daily challenge.
// Body: { guess: string, sessionId: string, userId?: string }
// ---------------------------------------------------------------------------

router.post('/guess', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const body = req.body as Record<string, unknown>;

    const guessText = body['guess'];
    if (typeof guessText !== 'string' || guessText.trim() === '') {
      sendValidationError(res, [
        { field: 'guess', message: '"guess" is required and must be a non-empty string' },
      ]);
      return;
    }

    const sessionId = body['sessionId'];
    if (typeof sessionId !== 'string' || sessionId.trim() === '') {
      sendValidationError(res, [
        { field: 'sessionId', message: '"sessionId" is required and must be a non-empty string' },
      ]);
      return;
    }

    const userId =
      typeof body['userId'] === 'string' && body['userId'].trim() !== ''
        ? body['userId'].trim()
        : undefined;

    const today = getTodayDate();
    const result = submitDailyGuess(today, guessText.trim(), sessionId.trim(), userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/daily/result
// Return the completed result with share text for a finished session.
// Query params: sessionId (required)
// ---------------------------------------------------------------------------

router.get('/result', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const sessionId =
      typeof req.query['sessionId'] === 'string' ? req.query['sessionId'].trim() : '';

    if (!sessionId) {
      sendValidationError(res, [
        { field: 'sessionId', message: '"sessionId" query parameter is required' },
      ]);
      return;
    }

    const today = getTodayDate();
    const result = getDailyResult(today, sessionId);

    if (!result) {
      res.status(404).json({
        error: 'No completed result found for this session',
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
