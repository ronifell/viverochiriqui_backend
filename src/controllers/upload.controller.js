'use strict';

const fs = require('fs/promises');
const path = require('path');
const { v4: uuid } = require('uuid');
const sharp = require('sharp');
const HttpError = require('../utils/httpError');
const { uploadDir, ALLOWED_VIDEO } = require('../middleware/upload.middleware');

// Store a path-only URL so images work in every environment (dev, staging, prod).
const publicUrlFor = (filename) => `/uploads/${filename}`;

const upload = async (req, res) => {
  const files = req.files?.length ? req.files : req.file ? [req.file] : [];
  if (!files.length) throw new HttpError(400, 'No files uploaded');

  const out = [];
  for (const f of files) {
    const isVideo = ALLOWED_VIDEO.includes(f.mimetype);
    const id = uuid();

    if (isVideo) {
      const ext = (f.originalname.match(/\.[a-z0-9]+$/i) || ['.mp4'])[0].toLowerCase();
      const filename = `${id}${ext}`;
      const target = path.join(uploadDir, filename);
      await fs.writeFile(target, f.buffer);
      out.push({
        url: publicUrlFor(filename),
        is_video: true,
        size: f.size,
        mime: f.mimetype,
      });
    } else {
      const filename = `${id}.webp`;
      const target = path.join(uploadDir, filename);
      const optimized = await sharp(f.buffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      await fs.writeFile(target, optimized);
      out.push({
        url: publicUrlFor(filename),
        is_video: false,
        size: optimized.length,
        mime: 'image/webp',
      });
    }
  }
  res.status(201).json({ data: out });
};

module.exports = { upload };
