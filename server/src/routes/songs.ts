import { Router, type Request, type Response, type NextFunction } from 'express';

import { sendValidationError } from '../middleware/validate.js';
import { searchTracks } from '../services/spotifyService.js';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/songs/search?q=<query>
// Search songs via Spotify (falls back to local catalog when unconfigured).
// ---------------------------------------------------------------------------

router.get('/search', (req: Request, res: Response, next: NextFunction): void => {
  const q = typeof req.query['q'] === 'string' ? req.query['q'].trim() : '';

  if (!q) {
    sendValidationError(res, [
      { field: 'q', message: '"q" query parameter is required and must be non-empty' },
    ]);
    return;
  }

  searchTracks(q, 10)
    .then((results) => {
      res.json(results);
    })
    .catch((err: unknown) => {
      next(err);
    });
});

export default router;
