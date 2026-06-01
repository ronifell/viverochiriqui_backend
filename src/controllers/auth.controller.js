'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const env = require('../config/env');
const { query } = require('../db/pool');
const HttpError = require('../utils/httpError');

const wholesaleSchema = z.object({
  password: z.string().min(1, 'Password required'),
});

const adminSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

const sign = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

const wholesaleLogin = async (req, res) => {
  const parsed = wholesaleSchema.safeParse(req.body || {});
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten());
  }
  const ip = req.headers['x-forwarded-for'] || req.ip || null;
  const ua = req.headers['user-agent'] || null;
  const success = parsed.data.password === env.WHOLESALE_PASSWORD;

  await query(
    `INSERT INTO wholesale_access_logs (success, ip_address, user_agent)
     VALUES ($1, $2, $3)`,
    [success, String(ip).slice(0, 64), ua]
  );

  if (!success) {
    throw new HttpError(401, 'Invalid wholesale password');
  }
  const token = sign({ role: 'wholesale' });
  res.json({ token, role: 'wholesale' });
};

const adminLogin = async (req, res) => {
  const parsed = adminSchema.safeParse(req.body || {});
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten());
  }
  const { email, password } = parsed.data;
  const { rows } = await query(
    `SELECT id, email, password_hash, name, is_active
     FROM admin_users WHERE email = $1`,
    [email.toLowerCase()]
  );
  const user = rows[0];
  if (!user || !user.is_active) {
    throw new HttpError(401, 'Invalid credentials');
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw new HttpError(401, 'Invalid credentials');
  }
  await query(
    `UPDATE admin_users SET last_login_at = NOW() WHERE id = $1`,
    [user.id]
  );
  const token = sign({
    id: user.id,
    role: 'admin',
    email: user.email,
    name: user.name,
  });
  res.json({
    token,
    role: 'admin',
    user: { id: user.id, email: user.email, name: user.name },
  });
};

const me = async (req, res) => {
  res.json({ user: req.user || null });
};

module.exports = { wholesaleLogin, adminLogin, me };
