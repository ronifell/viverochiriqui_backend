'use strict';

const { z } = require('zod');
const { pool, query } = require('../db/pool');
const HttpError = require('../utils/httpError');

const stockEnum = z.enum(['in_stock', 'low_stock', 'out_of_stock']);

const productSchema = z.object({
  name_es: z.string().min(1).max(200),
  name_en: z.string().min(1).max(200),
  description_es: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  retail_price: z.coerce.number().nonnegative(),
  wholesale_price: z.coerce.number().nonnegative(),
  pot_size: z.string().max(40).optional().nullable(),
  stock_status: stockEnum.default('in_stock'),
  promotion_text: z.string().max(120).optional().nullable(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
});

const partialProductSchema = productSchema.partial();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Normalize legacy absolute upload URLs to `/uploads/...` paths. */
const normalizeUploadUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('/uploads/')) return url;
  const idx = url.indexOf('/uploads/');
  if (idx !== -1) return url.slice(idx);
  return url;
};

const normalizeImages = (images) =>
  (images || []).map((img) => ({
    ...img,
    url: normalizeUploadUrl(img.url),
  }));

/**
 * Builds the public product DTO. Hides wholesale_price unless caller is wholesale or admin.
 */
const toDto = (row, role) => {
  const out = {
    id: row.id,
    name_es: row.name_es,
    name_en: row.name_en,
    description_es: row.description_es,
    description_en: row.description_en,
    category_id: row.category_id,
    category: row.category_slug
      ? {
          id: row.category_id,
          slug: row.category_slug,
          name_es: row.category_name_es,
          name_en: row.category_name_en,
        }
      : null,
    retail_price: parseFloat(row.retail_price),
    pot_size: row.pot_size,
    stock_status: row.stock_status,
    promotion_text: row.promotion_text,
    is_featured: row.is_featured,
    is_active: row.is_active,
    images: normalizeImages(row.images),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  if (role === 'wholesale' || role === 'admin') {
    out.wholesale_price = parseFloat(row.wholesale_price);
  }
  return out;
};

const baseSelect = `
  SELECT p.*,
         c.slug AS category_slug,
         c.name_es AS category_name_es,
         c.name_en AS category_name_en,
         COALESCE(
           (SELECT json_agg(json_build_object(
              'id', pi.id, 'url', pi.url, 'alt_text', pi.alt_text,
              'sort_order', pi.sort_order, 'is_primary', pi.is_primary,
              'is_video', pi.is_video
           ) ORDER BY pi.sort_order)
            FROM product_images pi WHERE pi.product_id = p.id),
           '[]'::json
         ) AS images
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

const list = async (req, res) => {
  const role = req.user?.role || 'public';

  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '24', 10), 1), 100);
  const offset = (page - 1) * limit;

  const filters = [];
  const values = [];
  let i = 1;

  if (role !== 'admin') {
    filters.push(`p.is_active = TRUE`);
  } else if (req.query.active === '1') {
    filters.push(`p.is_active = TRUE`);
  } else if (req.query.active === '0') {
    filters.push(`p.is_active = FALSE`);
  }

  if (req.query.category) {
    const cat = String(req.query.category);
    if (UUID_RE.test(cat)) {
      filters.push(`p.category_id = $${i++}`);
      values.push(cat);
    } else {
      filters.push(`c.slug = $${i++}`);
      values.push(cat);
    }
  }
  if (req.query.featured === '1') {
    filters.push(`p.is_featured = TRUE`);
  }
  if (req.query.stock) {
    filters.push(`p.stock_status = $${i++}`);
    values.push(req.query.stock);
  }
  if (req.query.q) {
    filters.push(
      `(lower(p.name_es) LIKE $${i} OR lower(p.name_en) LIKE $${i} OR
        lower(coalesce(p.description_es,'')) LIKE $${i} OR lower(coalesce(p.description_en,'')) LIKE $${i})`
    );
    values.push(`%${String(req.query.q).toLowerCase()}%`);
    i++;
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const sortMap = {
    newest: 'p.created_at DESC',
    oldest: 'p.created_at ASC',
    price_asc: 'p.retail_price ASC',
    price_desc: 'p.retail_price DESC',
    name: 'p.name_es ASC',
  };
  const order = sortMap[req.query.sort] || 'p.is_featured DESC, p.created_at DESC';

  const dataSql = `${baseSelect} ${where} ORDER BY ${order} LIMIT $${i++} OFFSET $${i++}`;
  values.push(limit, offset);
  const countSql = `SELECT COUNT(*)::int AS total FROM products p LEFT JOIN categories c ON c.id = p.category_id ${where}`;

  const [rowsResult, countResult] = await Promise.all([
    query(dataSql, values),
    query(countSql, values.slice(0, values.length - 2)),
  ]);

  res.json({
    data: rowsResult.rows.map((r) => toDto(r, role)),
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total,
      pages: Math.max(1, Math.ceil(countResult.rows[0].total / limit)),
    },
  });
};

const getOne = async (req, res) => {
  const role = req.user?.role || 'public';
  const id = req.params.id;
  const { rows } = await query(`${baseSelect} WHERE p.id = $1`, [id]);
  const row = rows[0];
  if (!row) throw new HttpError(404, 'Product not found');
  if (!row.is_active && role !== 'admin') {
    throw new HttpError(404, 'Product not found');
  }
  res.json({ data: toDto(row, role) });
};

const create = async (req, res) => {
  const parsed = productSchema.safeParse(req.body || {});
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten());
  }
  const p = parsed.data;
  const { rows } = await query(
    `INSERT INTO products (
        name_es, name_en, description_es, description_en,
        category_id, retail_price, wholesale_price,
        pot_size, stock_status, promotion_text,
        is_active, is_featured
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id`,
    [
      p.name_es,
      p.name_en,
      p.description_es ?? null,
      p.description_en ?? null,
      p.category_id ?? null,
      p.retail_price,
      p.wholesale_price,
      p.pot_size ?? null,
      p.stock_status,
      p.promotion_text ?? null,
      p.is_active,
      p.is_featured,
    ]
  );
  const { rows: full } = await query(`${baseSelect} WHERE p.id = $1`, [rows[0].id]);
  res.status(201).json({ data: toDto(full[0], 'admin') });
};

const update = async (req, res) => {
  const id = req.params.id;
  const parsed = partialProductSchema.safeParse(req.body || {});
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
  const { rowCount } = await query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${i}`,
    values
  );
  if (!rowCount) throw new HttpError(404, 'Product not found');
  const { rows: full } = await query(`${baseSelect} WHERE p.id = $1`, [id]);
  res.json({ data: toDto(full[0], 'admin') });
};

const remove = async (req, res) => {
  const id = req.params.id;
  const { rowCount } = await query('DELETE FROM products WHERE id = $1', [id]);
  if (!rowCount) throw new HttpError(404, 'Product not found');
  res.json({ ok: true });
};

const addImage = async (req, res) => {
  const id = req.params.id;
  const { url, alt_text, is_primary, is_video, sort_order } = req.body || {};
  if (!url) throw new HttpError(400, 'url is required');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (is_primary) {
      await client.query(
        `UPDATE product_images SET is_primary = FALSE WHERE product_id = $1`,
        [id]
      );
    }
    const { rows } = await client.query(
      `INSERT INTO product_images (product_id, url, alt_text, is_primary, is_video, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        id,
        url,
        alt_text || null,
        !!is_primary,
        !!is_video,
        Number.isFinite(+sort_order) ? +sort_order : 0,
      ]
    );
    await client.query('COMMIT');
    res.status(201).json({ data: rows[0] });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const removeImage = async (req, res) => {
  const { imageId } = req.params;
  const { rowCount } = await query('DELETE FROM product_images WHERE id = $1', [imageId]);
  if (!rowCount) throw new HttpError(404, 'Image not found');
  res.json({ ok: true });
};

const setPrimaryImage = async (req, res) => {
  const { id, imageId } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE product_images SET is_primary = FALSE WHERE product_id = $1`,
      [id]
    );
    const { rowCount } = await client.query(
      `UPDATE product_images SET is_primary = TRUE WHERE id = $1 AND product_id = $2`,
      [imageId, id]
    );
    if (!rowCount) throw new HttpError(404, 'Image not found');
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  addImage,
  removeImage,
  setPrimaryImage,
};
