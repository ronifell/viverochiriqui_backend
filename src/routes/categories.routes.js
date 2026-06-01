'use strict';

const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const { list, create, update, remove } = require('../controllers/categories.controller');
const { optionalAuth, requireAdmin } = require('../middleware/auth.middleware');

router.get('/', optionalAuth, asyncHandler(list));
router.post('/', requireAdmin, asyncHandler(create));
router.patch('/:id', requireAdmin, asyncHandler(update));
router.delete('/:id', requireAdmin, asyncHandler(remove));

module.exports = router;
