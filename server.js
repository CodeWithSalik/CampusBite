'use strict';

// ─── Load environment variables ────────────────────────────────────
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const healthRoutes = require('./server/routes/health');
const notFound = require('./server/middleware/notFound');
const errorHandler = require('./server/middleware/errorHandler');

// ─── Create Express app ────────────────────────────────────────────
const app = express();

// ─── Security headers ──────────────────────────────────────────────
app.use(helmet());

// ─── Global rate limiter ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});
app.use('/api', limiter);

// ─── Body parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ─── Serve static frontend files ───────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API routes ────────────────────────────────────────────────────
app.use('/api/health', healthRoutes);

// ─── 404 for unknown API endpoints ─────────────────────────────────
app.use('/api', notFound);

// ─── Serve index.html for non-API routes (SPA-style fallback) ──────
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Centralised error handler (must be last) ──────────────────────
app.use(errorHandler);

// ─── Start server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] CampusBite running on http://localhost:${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
