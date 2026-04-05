import { Router, type Request, type Response, type NextFunction } from 'express';

import { sendValidationError } from '../middleware/validate.js';
import type { AppError } from '../middleware/errorHandler.js';
import {
  createUser,
  getUser,
  updateUser,
  toUserPublic,
} from '../services/userService.js';
import { getUserStats } from '../services/statsService.js';

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/users
// Create a new user.
// Body: { nickname: string }
// Returns: UserPublic (201)
// ---------------------------------------------------------------------------

router.post('/', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const body = req.body as Record<string, unknown>;
    const nickname = body['nickname'];

    if (typeof nickname !== 'string' || nickname.trim() === '') {
      sendValidationError(res, [
        { field: 'nickname', message: '"nickname" is required and must be a non-empty string' },
      ]);
      return;
    }

    const user = createUser(nickname);
    res.status(201).json(toUserPublic(user));
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/users/:id
// Retrieve a user by ID.
// Returns: UserPublic (200) or 404
// ---------------------------------------------------------------------------

router.get('/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params as { id: string };
    const user = getUser(id);

    if (!user) {
      const err: AppError = new Error('User not found');
      err.statusCode = 404;
      err.isOperational = true;
      next(err);
      return;
    }

    res.json(toUserPublic(user));
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PUT /api/users/:id
// Update a user's nickname and/or avatar.
// Body: { nickname?: string; avatar?: string }
// Returns: UserPublic (200)
// ---------------------------------------------------------------------------

router.put('/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;

    const nickname = typeof body['nickname'] === 'string' ? body['nickname'] : undefined;
    const avatar = typeof body['avatar'] === 'string' ? body['avatar'] : undefined;

    if (nickname === undefined && avatar === undefined) {
      sendValidationError(res, [
        {
          field: 'nickname',
          message: 'At least one of "nickname" or "avatar" must be provided',
        },
      ]);
      return;
    }

    const user = updateUser(id, { nickname, avatar });
    res.json(toUserPublic(user));
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/users/:id/stats
// Return aggregated stats for a user.
// Returns: UserStatsResult (200) or 404
// ---------------------------------------------------------------------------

router.get('/:id/stats', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params as { id: string };
    const stats = getUserStats(id);

    if (!stats) {
      const err: AppError = new Error('User not found');
      err.statusCode = 404;
      err.isOperational = true;
      next(err);
      return;
    }

    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
