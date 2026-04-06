// Vercel serverless entry point
// This file imports the compiled Express app and exports it for Vercel

// Handler cache
let appPromise = null;
let dbInitialized = false;

module.exports = async (req, res) => {
  // Lazy load app on first request using dynamic import (ES module)
  if (!appPromise) {
    appPromise = import('../server/dist/index.js').then(m => m.default);
  }
  
  const app = await appPromise;
  
  // Initialize database on cold start
  if (!dbInitialized) {
    try {
      const { getDb } = await import('../server/dist/database.js');
      await getDb();
      dbInitialized = true;
    } catch (e) {
      console.error('Failed to initialize database:', e);
      // Continue anyway - let the request fail naturally if DB is needed
    }
  }
  
  return app(req, res);
};
