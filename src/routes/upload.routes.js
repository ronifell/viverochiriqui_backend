'use strict';

const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const { upload: multerUpload } = require('../middleware/upload.middleware');
const { requireAdmin } = require('../middleware/auth.middleware');
const { upload } = require('../controllers/upload.controller');

router.post(
  '/',
  requireAdmin,
  multerUpload.array('files', 10),
  asyncHandler(upload)
);

module.exports = router;
