// Vercel serverless entry point
// This file imports the compiled Express app and exports it for Vercel

// Handler cache
let app = null;
let dbInitialized = false;

module.exports = async (req, res) => {
  // Lazy load app on first request
  if (!app) {
    try {
      app = require('../server/dist/index.js').default;
    } catch (e) {
      console.error('Failed to load app:', e);
      res.status(500).json({ error: 'Server initialization failed', details: e.message });
      return;
    }
  }
  
  // Initialize database on cold start
  if (!dbInitialized) {
    try {
      const { getDb } = require('../server/dist/database.js');
      await getDb();
      dbInitialized = true;
    } catch (e) {
      console.error('Failed to initialize database:', e);
      // Continue anyway - let the request fail naturally if DB is needed
    }
  }
  
  return app(req, res);
};
