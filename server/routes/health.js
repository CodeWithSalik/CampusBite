'use strict';

const { Router } = require('express');
const { getSafeDiagnostics } = require('../config/database');

const router = Router();

/**
 * GET /api/health
 * Basic health-check and operational diagnostics endpoint.
 * Returns safe environment and database connectivity metrics without exposing credentials.
 */
router.get('/', (_req, res) => {
  const diagnostics = getSafeDiagnostics();

  res.json({
    success: true,
    message: 'CampusBite API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: diagnostics.connected,
      configured: diagnostics.configured,
      name: diagnostics.databaseName
    },
    environment: diagnostics.environment
  });
});

module.exports = router;
