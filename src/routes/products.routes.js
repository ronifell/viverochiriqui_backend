'use strict';

const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const products = require('../controllers/products.controller');
const { optionalAuth, requireAdmin } = require('../middleware/auth.middleware');

router.get('/', optionalAuth, asyncHandler(products.list));
router.get('/:id', optionalAuth, asyncHandler(products.getOne));

// Admin-only
router.post('/', requireAdmin, asyncHandler(products.create));
router.patch('/:id', requireAdmin, asyncHandler(products.update));
router.delete('/:id', requireAdmin, asyncHandler(products.remove));

router.post('/:id/images', requireAdmin, asyncHandler(products.addImage));
router.delete('/:id/images/:imageId', requireAdmin, asyncHandler(products.removeImage));
router.post('/:id/images/:imageId/primary', requireAdmin, asyncHandler(products.setPrimaryImage));

module.exports = router;
