import { Router } from 'express';

const router = Router();

/**
 * GET /api/songs/search
 * Search songs by query string (proxies to Spotify or local store).
 * Stub — full implementation in Sprint 3.
 */
router.get('/search', (_req, res) => {
  res.status(501).json({ status: 'error', message: 'Not implemented' });
});

export default router;
