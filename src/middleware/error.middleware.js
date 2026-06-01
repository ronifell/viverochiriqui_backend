'use strict';

const env = require('../config/env');

// 404 handler
const notFound = (req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
};

// Generic error handler
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  const status = err.status || 500;
  const payload = {
    error: err.message || 'Server Error',
  };
  if (err.details) payload.details = err.details;
  if (env.NODE_ENV !== 'production' && status >= 500) {
    payload.stack = err.stack;
  }
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }
  res.status(status).json(payload);
};

module.exports = { notFound, errorHandler };
