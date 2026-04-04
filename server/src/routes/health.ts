import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 * Liveness probe — returns server status, timestamp, and uptime.
 */
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

export default router;
