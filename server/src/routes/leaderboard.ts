import { Router, type Request, type Response, type NextFunction } from 'express';

import type { AppError } from '../middleware/errorHandler.js';
import { getLeaderboard } from '../services/leaderboardService.js';

const router = Router();

// ISO date pattern: YYYY-MM-DD
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// GET /api/leaderboard?date=YYYY-MM-DD
// Return the ranked leaderboard for the given date (defaults to today).
// ---------------------------------------------------------------------------

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawDate = req.query['date'];

    let date: string;

    if (rawDate === undefined || rawDate === null || rawDate === '') {
      date = todayUtc();
    } else if (typeof rawDate !== 'string') {
      const err: AppError = new Error('"date" must be a single string value in YYYY-MM-DD format');
      err.statusCode = 400;
      err.isOperational = true;
      next(err);
      return;
    } else if (!DATE_REGEX.test(rawDate)) {
      const err: AppError = new Error('"date" must be in YYYY-MM-DD format');
      err.statusCode = 400;
      err.isOperational = true;
      next(err);
      return;
    } else {
      date = rawDate;
    }

    const result = await getLeaderboard(date);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
