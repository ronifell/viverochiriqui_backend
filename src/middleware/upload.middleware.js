'use strict';

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const env = require('../config/env');
const HttpError = require('../utils/httpError');

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm'];

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const ok = [...ALLOWED_IMAGE, ...ALLOWED_VIDEO].includes(file.mimetype);
  if (!ok) {
    return cb(new HttpError(400, `Unsupported file type: ${file.mimetype}`));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
});

module.exports = {
  upload,
  uploadDir,
  ALLOWED_IMAGE,
  ALLOWED_VIDEO,
};
