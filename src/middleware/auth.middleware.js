'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const HttpError = require('../utils/httpError');

const extractToken = (req) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  if (req.cookies?.token) return req.cookies.token;
  return null;
};

const verifyToken = (req) => {
  const token = extractToken(req);
  if (!token) throw new HttpError(401, 'Authentication required');
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (_e) {
    throw new HttpError(401, 'Invalid or expired token');
  }
};

const requireAdmin = (req, _res, next) => {
  try {
    const payload = verifyToken(req);
    if (payload.role !== 'admin') {
      throw new HttpError(403, 'Admin access required');
    }
    req.user = payload;
    next();
  } catch (e) {
    next(e);
  }
};

const requireWholesale = (req, _res, next) => {
  try {
    const payload = verifyToken(req);
    if (payload.role !== 'wholesale' && payload.role !== 'admin') {
      throw new HttpError(403, 'Wholesale access required');
    }
    req.user = payload;
    next();
  } catch (e) {
    next(e);
  }
};

const optionalAuth = (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
  } catch (_e) {
    // Ignore — request is treated as anonymous.
  }
  next();
};

module.exports = {
  requireAdmin,
  requireWholesale,
  optionalAuth,
};
