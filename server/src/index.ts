import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { PORT, CORS_ORIGIN, NODE_ENV } from './config.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route modules
import healthRouter from './routes/health.js';
import challengesRouter from './routes/challenges.js';
import dailyRouter from './routes/daily.js';
import leaderboardRouter from './routes/leaderboard.js';
import songsRouter from './routes/songs.js';

// Initialize database (runs schema migration on startup)
import './database.js';

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

// --- Routes ---
app.use('/api/health', healthRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/daily', dailyRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/songs', songsRouter);

// --- Global error handler (must be registered last) ---
app.use(errorHandler);

// --- Server startup ---
const server = app.listen(PORT, () => {
  console.log(`[HumDuel] Server running on port ${PORT} (${NODE_ENV})`);
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
