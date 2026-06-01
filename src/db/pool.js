'use strict';

const { Pool } = require('pg');
const env = require('../config/env');

/**
 * Enable SSL whenever we connect to a remote host (anything other than
 * localhost / 127.0.0.1). This covers managed Postgres providers such as
 * Supabase, Neon, RDS, etc., regardless of NODE_ENV.
 */
const isLocal = (host) =>
  !host || host === 'localhost' || host === '127.0.0.1' || host === '::1';

const hostFromUrl = (url) => {
  try {
    return new URL(url).hostname;
  } catch (_e) {
    return null;
  }
};

const needsSsl = env.DATABASE_URL
  ? !isLocal(hostFromUrl(env.DATABASE_URL))
  : !isLocal(env.PGHOST);

const sslOption =
  env.NODE_ENV === 'production' || needsSsl
    ? { rejectUnauthorized: false }
    : false;

const pool = env.DATABASE_URL
  ? new Pool({
      connectionString: env.DATABASE_URL,
      ssl: sslOption,
    })
  : new Pool({
      host: env.PGHOST,
      port: env.PGPORT,
      user: env.PGUSER,
      password: env.PGPASSWORD,
      database: env.PGDATABASE,
      ssl: sslOption,
    });

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[pg] Unexpected pool error:', err);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
