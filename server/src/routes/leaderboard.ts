import { Router } from 'express';

const router = Router();

/**
 * GET /api/leaderboard
 * Retrieve the leaderboard for a given date (query param: date).
 * Stub — full implementation in Sprint 3.
 */
router.get('/', (_req, res) => {
  res.status(501).json({ status: 'error', message: 'Not implemented' });
});

export default router;
