import { Router } from 'express';

const router = Router();

/**
 * GET /api/daily
 * Retrieve today's daily challenge.
 * Stub — full implementation in Sprint 3.
 */
router.get('/', (_req, res) => {
  res.status(501).json({ status: 'error', message: 'Not implemented' });
});

/**
 * POST /api/daily/guess
 * Submit a guess for today's daily challenge.
 * Stub — full implementation in Sprint 3.
 */
router.post('/guess', (_req, res) => {
  res.status(501).json({ status: 'error', message: 'Not implemented' });
});

export default router;
