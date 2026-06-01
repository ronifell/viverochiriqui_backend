'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const { uploadDir } = require('./middleware/upload.middleware');

const authRoutes = require('./routes/auth.routes');
const categoriesRoutes = require('./routes/categories.routes');
const productsRoutes = require('./routes/products.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: env.FRONTEND_ORIGIN === '*' ? true : env.FRONTEND_ORIGIN,
    credentials: true,
  })
);

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), uploadDir), {
    maxAge: '7d',
    immutable: true,
  })
);

app.get('/health', (_req, res) =>
  res.json({ ok: true, service: 'viverochiriqui-api', time: new Date().toISOString() })
);

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/admin/upload', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
