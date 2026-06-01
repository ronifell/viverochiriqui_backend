'use strict';

/**
 * Populates the database with sample categories and products.
 * Run with: npm run db:seed
 */

const { pool } = require('./pool');

const categories = [
  { slug: 'flowering',   name_es: 'Plantas Floridas',   name_en: 'Flowering Plants', icon: 'flower',     sort_order: 1 },
  { slug: 'indoor',      name_es: 'Plantas de Interior', name_en: 'Indoor Plants',    icon: 'leaf',       sort_order: 2 },
  { slug: 'sun',         name_es: 'Plantas de Sol',      name_en: 'Sun-Loving Plants', icon: 'sun',       sort_order: 3 },
  { slug: 'trees',       name_es: 'Árboles',             name_en: 'Trees',            icon: 'tree',       sort_order: 4 },
  { slug: 'fruit-trees', name_es: 'Árboles Frutales',    name_en: 'Fruit Trees',      icon: 'apple',      sort_order: 5 },
  { slug: 'succulents',  name_es: 'Suculentas',          name_en: 'Succulents',       icon: 'succulent',  sort_order: 6 },
  { slug: 'cacti',       name_es: 'Cactus',              name_en: 'Cacti',            icon: 'cactus',     sort_order: 7 },
  { slug: 'pots',        name_es: 'Macetas',             name_en: 'Pots',             icon: 'pot',        sort_order: 8 },
  { slug: 'soil',        name_es: 'Tierra y Fertilizantes', name_en: 'Soil & Fertilizer', icon: 'soil', sort_order: 9 },
  { slug: 'accessories', name_es: 'Accesorios',          name_en: 'Accessories',      icon: 'tag',        sort_order: 10 },
];

const products = [
  {
    name_es: 'Monstera Deliciosa',
    name_en: 'Monstera Deliciosa',
    description_es: 'Planta tropical de hojas grandes y perforadas. Ideal para interiores con luz indirecta.',
    description_en: 'Tropical plant with large fenestrated leaves. Ideal for indoor spaces with indirect light.',
    cat: 'indoor',
    retail_price: 12.50,
    wholesale_price: 8.75,
    pot_size: 'Maceta #15',
    stock_status: 'in_stock',
    promotion_text: 'Más vendido',
    is_featured: true,
  },
  {
    name_es: 'Sansevieria Laurentii',
    name_en: 'Sansevieria Laurentii',
    description_es: 'Lengua de suegra, resistente y purifica el aire. Necesita poco riego.',
    description_en: 'Snake plant, hardy and air-purifying. Requires very little water.',
    cat: 'indoor',
    retail_price: 8.75,
    wholesale_price: 6.25,
    pot_size: 'Maceta #12',
    stock_status: 'in_stock',
    promotion_text: 'Nuevo',
    is_featured: true,
  },
  {
    name_es: 'Suculenta Echeveria',
    name_en: 'Echeveria Succulent',
    description_es: 'Suculenta en roseta perfecta para escritorios y ventanas soleadas.',
    description_en: 'Rosette succulent — perfect for desks and sunny windowsills.',
    cat: 'succulents',
    retail_price: 3.25,
    wholesale_price: 2.25,
    pot_size: 'Maceta #6',
    stock_status: 'low_stock',
    is_featured: true,
  },
  {
    name_es: 'Palma Areca',
    name_en: 'Areca Palm',
    description_es: 'Palma elegante para sala o terrazas con luz brillante. Aporta frescura tropical.',
    description_en: 'Elegant palm for living rooms or bright terraces. Adds tropical freshness.',
    cat: 'indoor',
    retail_price: 15.00,
    wholesale_price: 11.00,
    pot_size: 'Maceta #17',
    stock_status: 'in_stock',
    promotion_text: 'Oferta',
    is_featured: true,
  },
  {
    name_es: 'Cactus Bola de Oro',
    name_en: 'Golden Barrel Cactus',
    description_es: 'Cactus globoso, bajo mantenimiento. Ideal para climas cálidos y secos.',
    description_en: 'Globe-shaped cactus, low maintenance. Ideal for warm dry climates.',
    cat: 'cacti',
    retail_price: 2.50,
    wholesale_price: 1.75,
    pot_size: 'Maceta #8',
    stock_status: 'in_stock',
  },
  {
    name_es: 'Philodendron Brasil',
    name_en: 'Philodendron Brasil',
    description_es: 'Enredadera tropical de hojas variegadas verde y amarillo. Crece rápido.',
    description_en: 'Tropical vine with variegated green-and-yellow leaves. Fast growing.',
    cat: 'indoor',
    retail_price: 7.50,
    wholesale_price: 5.50,
    pot_size: 'Maceta #12',
    stock_status: 'in_stock',
  },
  {
    name_es: 'Rosal Rojo',
    name_en: 'Red Rose Bush',
    description_es: 'Rosal clásico de flores rojas intensas. Perfecto para jardines exteriores.',
    description_en: 'Classic red rose bush. Perfect for outdoor gardens.',
    cat: 'flowering',
    retail_price: 9.99,
    wholesale_price: 7.25,
    pot_size: 'Maceta #14',
    stock_status: 'in_stock',
  },
  {
    name_es: 'Limonero',
    name_en: 'Lemon Tree',
    description_es: 'Cítrico productivo. Floración aromática y frutos durante todo el año en clima cálido.',
    description_en: 'Productive citrus tree. Aromatic blossoms and year-round fruit in warm climates.',
    cat: 'fruit-trees',
    retail_price: 24.00,
    wholesale_price: 17.50,
    pot_size: 'Maceta #20',
    stock_status: 'low_stock',
    promotion_text: 'Frutal',
  },
  {
    name_es: 'Ficus Lyrata',
    name_en: 'Fiddle Leaf Fig',
    description_es: 'Ficus de hojas grandes en forma de violín. Punto focal en cualquier sala.',
    description_en: 'Fig with large violin-shaped leaves. A focal point in any living room.',
    cat: 'indoor',
    retail_price: 28.50,
    wholesale_price: 21.00,
    pot_size: 'Maceta #20',
    stock_status: 'in_stock',
  },
  {
    name_es: 'Maceta Cerámica Blanca 12cm',
    name_en: 'White Ceramic Pot 12cm',
    description_es: 'Maceta de cerámica blanca con plato. Ideal para suculentas y plantas pequeñas.',
    description_en: 'White ceramic pot with saucer. Ideal for succulents and small plants.',
    cat: 'pots',
    retail_price: 4.50,
    wholesale_price: 3.20,
    pot_size: '12 cm',
    stock_status: 'in_stock',
  },
  {
    name_es: 'Tierra Orgánica 10kg',
    name_en: 'Organic Soil 10kg',
    description_es: 'Sustrato orgánico premium. Excelente drenaje y nutrientes para cualquier planta.',
    description_en: 'Premium organic substrate. Excellent drainage and nutrients for any plant.',
    cat: 'soil',
    retail_price: 6.00,
    wholesale_price: 4.20,
    pot_size: '10 kg',
    stock_status: 'in_stock',
  },
  {
    name_es: 'Bromelia Roja',
    name_en: 'Red Bromeliad',
    description_es: 'Planta exótica con flor roja vibrante de larga duración.',
    description_en: 'Exotic plant with a long-lasting vibrant red flower.',
    cat: 'flowering',
    retail_price: 11.50,
    wholesale_price: 8.50,
    pot_size: 'Maceta #14',
    stock_status: 'out_of_stock',
  },
];

const placeholderImage = () =>
  'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=900&q=70';

// Stable, real Unsplash plant photos so the catalog looks polished out of the box.
const productImages = {
  'Monstera Deliciosa':           'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=900&q=70',
  'Sansevieria Laurentii':        'https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?auto=format&fit=crop&w=900&q=70',
  'Suculenta Echeveria':          'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=900&q=70',
  'Echeveria Succulent':          'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=900&q=70',
  'Palma Areca':                  'https://images.unsplash.com/photo-1602923668104-8f9e03e77e62?auto=format&fit=crop&w=900&q=70',
  'Areca Palm':                   'https://images.unsplash.com/photo-1602923668104-8f9e03e77e62?auto=format&fit=crop&w=900&q=70',
  'Cactus Bola de Oro':           'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=900&q=70',
  'Golden Barrel Cactus':         'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=900&q=70',
  'Philodendron Brasil':          'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=70',
  'Rosal Rojo':                   'https://images.unsplash.com/photo-1496062031456-07b8f162a322?auto=format&fit=crop&w=900&q=70',
  'Red Rose Bush':                'https://images.unsplash.com/photo-1496062031456-07b8f162a322?auto=format&fit=crop&w=900&q=70',
  'Limonero':                     'https://images.unsplash.com/photo-1491147334573-44cbb4602074?auto=format&fit=crop&w=900&q=70',
  'Lemon Tree':                   'https://images.unsplash.com/photo-1491147334573-44cbb4602074?auto=format&fit=crop&w=900&q=70',
  'Ficus Lyrata':                 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=70',
  'Fiddle Leaf Fig':              'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=70',
  'Maceta Cerámica Blanca 12cm':  'https://images.unsplash.com/photo-1459156212016-c812468e2115?auto=format&fit=crop&w=900&q=70',
  'White Ceramic Pot 12cm':       'https://images.unsplash.com/photo-1459156212016-c812468e2115?auto=format&fit=crop&w=900&q=70',
  'Tierra Orgánica 10kg':         'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=70',
  'Organic Soil 10kg':            'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=70',
  'Bromelia Roja':                'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=900&q=70',
  'Red Bromeliad':                'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=900&q=70',
};

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Wipe existing demo data (idempotent).
    await client.query('DELETE FROM product_images');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM categories');

    const catIdBySlug = {};
    for (const c of categories) {
      const { rows } = await client.query(
        `INSERT INTO categories (slug, name_es, name_en, icon, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         RETURNING id`,
        [c.slug, c.name_es, c.name_en, c.icon, c.sort_order]
      );
      catIdBySlug[c.slug] = rows[0].id;
    }

    for (const p of products) {
      const { rows } = await client.query(
        `INSERT INTO products (
            name_es, name_en, description_es, description_en,
            category_id, retail_price, wholesale_price,
            pot_size, stock_status, promotion_text,
            is_active, is_featured)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,$11)
         RETURNING id`,
        [
          p.name_es,
          p.name_en,
          p.description_es,
          p.description_en,
          catIdBySlug[p.cat],
          p.retail_price,
          p.wholesale_price,
          p.pot_size,
          p.stock_status,
          p.promotion_text || null,
          p.is_featured || false,
        ]
      );
      const productId = rows[0].id;
      const url =
        productImages[p.name_es] ||
        productImages[p.name_en] ||
        placeholderImage();

      await client.query(
        `INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
         VALUES ($1, $2, $3, 0, TRUE)`,
        [productId, url, p.name_es]
      );
    }

    await client.query('COMMIT');
    // eslint-disable-next-line no-console
    console.log(
      `[seed] Inserted ${categories.length} categories and ${products.length} products ✔`
    );
  } catch (err) {
    await client.query('ROLLBACK');
    // eslint-disable-next-line no-console
    console.error('[seed] Failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
