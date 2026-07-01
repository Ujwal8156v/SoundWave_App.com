const logger = require('./logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: err.details || {}
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }

  // Database errors
  if (err.code && err.code.startsWith('23')) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Resource already exists'
      }
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error'
    }
  });
};

module.exports = { errorHandler };
