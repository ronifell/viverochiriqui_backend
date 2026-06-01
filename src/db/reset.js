'use strict';

/**
 * Drops all tables (DEV ONLY) and re-runs init.
 */

const { pool } = require('./pool');

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      DROP TABLE IF EXISTS product_images CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS admin_users CASCADE;
      DROP TABLE IF EXISTS wholesale_access_logs CASCADE;
      DROP TYPE IF EXISTS stock_status_t;
    `);
    await client.query('COMMIT');
    // eslint-disable-next-line no-console
    console.log('[reset] All tables dropped ✔');
  } catch (err) {
    await client.query('ROLLBACK');
    // eslint-disable-next-line no-console
    console.error('[reset] Failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
