// Vercel serverless entry point
// This file imports the compiled Express app and exports it for Vercel

module.exports = require('../dist/index.js').default;
