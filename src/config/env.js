'use strict';

require('dotenv').config();

const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',

  DATABASE_URL: process.env.DATABASE_URL || null,
  PGHOST: process.env.PGHOST || 'localhost',
  PGPORT: parseInt(process.env.PGPORT || '5432', 10),
  PGUSER: process.env.PGUSER || 'postgres',
  PGPASSWORD: process.env.PGPASSWORD || 'postgres',
  PGDATABASE: process.env.PGDATABASE || 'viverochiriqui',

  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  WHOLESALE_PASSWORD: process.env.WHOLESALE_PASSWORD || 'mayorista2026',

  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@viverochiriqui.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin1234',

  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_UPLOAD_MB: parseInt(process.env.MAX_UPLOAD_MB || '15', 10),
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || 'http://localhost:4000',
};

module.exports = env;
