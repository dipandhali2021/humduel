import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { PORT, CORS_ORIGIN, NODE_ENV, UPLOAD_DIR } from './config.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ensureUploadDir } from './services/audioService.js';

// Route modules
import healthRouter from './routes/health.js';
import challengesRouter from './routes/challenges.js';
import dailyRouter from './routes/daily.js';
import leaderboardRouter from './routes/leaderboard.js';
import songsRouter from './routes/songs.js';
import usersRouter from './routes/users.js';

// Initialize database (runs schema migration on startup)
import './database.js';

// Ensure the uploads directory exists before handling any requests
ensureUploadDir();

const app = express();

// --- Security middleware ---
app.use(helmet());
app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// --- Body parsing ---
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// --- Rate limiting ---
app.use('/api', generalLimiter);

// --- Static audio file serving ---
// Serves files from UPLOAD_DIR at the /audio/ path prefix.
app.use('/audio', express.static(UPLOAD_DIR));

// --- Routes ---
app.use('/api/health', healthRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/daily', dailyRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/songs', songsRouter);
app.use('/api/users', usersRouter);

// --- Global error handler (must be registered last) ---
app.use(errorHandler);

// --- Server startup ---
const server = app.listen(PORT, () => {
  console.log(`[HumDuel] Server running on port ${PORT} (${NODE_ENV})`);
  console.log(`[HumDuel] Audio uploads served from ${UPLOAD_DIR} at /audio/`);
});

// --- Graceful shutdown ---
function shutdown(signal: string) {
  console.log(`\n[HumDuel] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[HumDuel] HTTP server closed.');
    process.exit(0);
  });

  // Force exit after 10 seconds if connections linger
  setTimeout(() => {
    console.error('[HumDuel] Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
