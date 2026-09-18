/**
 * Centralized error handling middleware.
 * Formats errors cleanly without exposing raw stack traces in production.
 */
export function errorHandler(err, req, res, next) {
  console.error(`🚨 [API Error] ${req.method} ${req.originalUrl}:`, err.message);

  const statusCode = res.statusCode === 200 ? (err.statusCode || 500) : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || null,
    timestamp: new Date().toISOString()
  });
}

/**
 * Fallback 404 handler for unmatched /api/* requests.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}
