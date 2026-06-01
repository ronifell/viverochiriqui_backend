'use strict';

/**
 * Initializes the database: creates tables and ensures a default admin exists.
 * Run with: npm run db:init
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./pool');
const env = require('../config/env');

async function run() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(schema);

    // Bootstrap admin if none exists.
    const { rows } = await client.query(
      'SELECT COUNT(*)::int AS count FROM admin_users'
    );
    if (rows[0].count === 0) {
      const hash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
      await client.query(
        `INSERT INTO admin_users (email, password_hash, name)
         VALUES ($1, $2, $3)`,
        [env.ADMIN_EMAIL, hash, 'Administrator']
      );
      // eslint-disable-next-line no-console
      console.log(`[init] Default admin created → ${env.ADMIN_EMAIL}`);
    }

    await client.query('COMMIT');
    // eslint-disable-next-line no-console
    console.log('[init] Schema ready ✔');
  } catch (err) {
    await client.query('ROLLBACK');
    // eslint-disable-next-line no-console
    console.error('[init] Failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
