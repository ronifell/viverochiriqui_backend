'use strict';

/**
 * Wraps an async route handler so unhandled rejections flow to error middleware.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
