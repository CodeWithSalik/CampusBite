'use strict';

const { Router } = require('express');

const router = Router();

/**
 * GET /api/health
 * Basic health-check endpoint.
 */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'CampusBite API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
