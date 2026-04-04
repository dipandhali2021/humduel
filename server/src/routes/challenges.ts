import { Router } from 'express';

const router = Router();

/**
 * GET /api/challenges/:id
 * Retrieve a single challenge by ID.
 * Stub — full implementation in Sprint 2.
 */
router.get('/:id', (_req, res) => {
  res.status(501).json({ status: 'error', message: 'Not implemented' });
});

/**
 * POST /api/challenges
 * Create a new challenge with an audio upload.
 * Stub — full implementation in Sprint 1.
 */
router.post('/', (_req, res) => {
  res.status(501).json({ status: 'error', message: 'Not implemented' });
});

/**
 * POST /api/challenges/:id/guess
 * Submit a guess for a challenge.
 * Stub — full implementation in Sprint 2.
 */
router.post('/:id/guess', (_req, res) => {
  res.status(501).json({ status: 'error', message: 'Not implemented' });
});

export default router;
