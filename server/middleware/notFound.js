'use strict';

/**
 * 404 handler for unknown API endpoints.
 */
function notFound(req, res, _next) {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`,
  });
}

module.exports = notFound;
