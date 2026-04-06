// Vercel serverless entry point
// This file imports the compiled Express app and exports it for Vercel

const app = require('../server/dist/index.js').default;

// Initialize database on cold start
let dbInitialized = false;

module.exports = async (req, res) => {
  if (!dbInitialized) {
    const { getDb } = require('../server/dist/database.js');
    await getDb();
    dbInitialized = true;
  }
  
  return app(req, res);
};
