'use strict';

const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../utils/asyncHandler');
const { wholesaleLogin, adminLogin, me } = require('../controllers/auth.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});

router.post('/wholesale', loginLimiter, asyncHandler(wholesaleLogin));
router.post('/admin', loginLimiter, asyncHandler(adminLogin));
router.get('/me', optionalAuth, asyncHandler(me));

module.exports = router;
