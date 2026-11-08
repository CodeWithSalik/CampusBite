'use strict';

/**
 * Centralised error-handling middleware.
 * Must be registered AFTER all routes.
 */
function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;

  // In production, preserve operational client errors (4xx) and explicit 503 service unavailable messages.
  // Mask only unexpected internal server crashes (500) to prevent leaking stack traces.
  let message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV === 'production' && statusCode >= 500 && statusCode !== 503) {
    message = 'Internal Server Error';
  }

  console.error(`[Error] ${statusCode} — ${err.message}`);
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

module.exports = errorHandler;
