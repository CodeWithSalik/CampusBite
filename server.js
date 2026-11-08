'use strict';

// ─── Load environment variables ────────────────────────────────────
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { connectDB, isConnected } = require('./server/config/database');
const healthRoutes = require('./server/routes/health');
const authRoutes = require('./server/routes/auth');
const menuRoutes = require('./server/routes/menu');
const orderRoutes = require('./server/routes/orders');
const adminRoutes = require('./server/routes/admin');
const { protectAdminPages } = require('./server/middleware/auth');
const notFound = require('./server/middleware/notFound');
const errorHandler = require('./server/middleware/errorHandler');

// ─── Create Express app ────────────────────────────────────────────
const app = express();

// ─── Security headers ──────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        upgradeInsecureRequests: []
      }
    }
  })
);

// ─── Global rate limiter for API ────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                  // limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
});
app.use('/api', apiLimiter);

// ─── Body parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ─── Session Management ────────────────────────────────────────────
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'campusbite_dev_fallback_secret_key_326',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Use MongoDB session store if MONGODB_URI is available
if (process.env.MONGODB_URI) {
  try {
    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      dbName: process.env.DB_NAME || 'campusbite',
      collectionName: 'sessions',
      ttl: 24 * 60 * 60 // 1 day
    });
    console.log('[Session] Using MongoDB Atlas session store');
  } catch (err) {
    console.warn('[Session] Failed to initialize MongoStore, falling back to MemoryStore:', err.message);
  }
} else {
  console.log('[Session] Using MemoryStore (MONGODB_URI not configured)');
}

app.use(session(sessionConfig));

// ─── Server-side Admin Page Route Protection ───────────────────────
// Protect direct access to admin HTML pages before static files are served
app.use(protectAdminPages);

// ─── Serve static frontend files ───────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API routes ────────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 for unknown API endpoints ─────────────────────────────────
app.use('/api', notFound);

// ─── Serve index.html for non-API routes (SPA-style fallback) ──────
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Centralised error handler (must be last) ──────────────────────
app.use(errorHandler);

// ─── Initialize MongoDB & Start server ─────────────────────────────
const PORT = process.env.PORT || 5000;

async function startServer() {
  // Attempt DB connection if URI is present
  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
    } catch (err) {
      console.warn('[Server] Notice: Database connection not established. API will operate with graceful fallbacks.');
    }
  } else {
    console.log('[Server] Notice: MONGODB_URI not set in environment. Running in mock/standalone mode.');
  }

  // Only start listening if run directly (allows tests to require app without port collision)
  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`[Server] CampusBite running on http://localhost:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
}

startServer();

module.exports = app;
