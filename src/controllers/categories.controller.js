'use strict';

const { z } = require('zod');
const { query } = require('../db/pool');
const HttpError = require('../utils/httpError');

const categorySchema = z.object({
  slug: z.string().min(1).max(80),
  name_es: z.string().min(1).max(120),
  name_en: z.string().min(1).max(120),
  icon: z.string().max(60).optional().nullable(),
  sort_order: z.number().int().nonnegative().default(0),
  is_active: z.boolean().default(true),
});

const list = async (req, res) => {
  const includeInactive = req.user?.role === 'admin' && req.query.all === '1';
  const { rows } = await query(
    `SELECT c.id, c.slug, c.name_es, c.name_en, c.icon, c.sort_order, c.is_active,
            COALESCE(p.product_count, 0)::int AS product_count
     FROM categories c
     LEFT JOIN (
        SELECT category_id, COUNT(*) AS product_count
        FROM products WHERE is_active = TRUE
        GROUP BY category_id
     ) p ON p.category_id = c.id
     ${includeInactive ? '' : 'WHERE c.is_active = TRUE'}
     ORDER BY c.sort_order ASC, c.name_es ASC`
  );
  res.json({ data: rows });
};

const create = async (req, res) => {
  const parsed = categorySchema.safeParse(req.body || {});
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten());
  }
  const c = parsed.data;
  const { rows } = await query(
    `INSERT INTO categories (slug, name_es, name_en, icon, sort_order, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [c.slug, c.name_es, c.name_en, c.icon || null, c.sort_order, c.is_active]
  );
  res.status(201).json({ data: rows[0] });
};

const update = async (req, res) => {
  const id = req.params.id;
  const parsed = categorySchema.partial().safeParse(req.body || {});
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten());
  }
  const fields = [];
  const values = [];
  let i = 1;
  for (const [k, v] of Object.entries(parsed.data)) {
    fields.push(`${k} = $${i++}`);
    values.push(v);
  }
  if (!fields.length) throw new HttpError(400, 'No fields to update');
  values.push(id);
  const { rows } = await query(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  if (!rows[0]) throw new HttpError(404, 'Category not found');
  res.json({ data: rows[0] });
};

const remove = async (req, res) => {
  const id = req.params.id;
  const { rowCount } = await query('DELETE FROM categories WHERE id = $1', [id]);
  if (!rowCount) throw new HttpError(404, 'Category not found');
  res.json({ ok: true });
};

module.exports = { list, create, update, remove };
