-- Vivero Chiriquí — PostgreSQL schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- categories
-- =========================================================================
CREATE TABLE IF NOT EXISTS categories (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug         VARCHAR(80)  NOT NULL UNIQUE,
    name_es      VARCHAR(120) NOT NULL,
    name_en      VARCHAR(120) NOT NULL,
    icon         VARCHAR(60),
    sort_order   INTEGER      NOT NULL DEFAULT 0,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_active_sort
    ON categories (is_active, sort_order);

-- =========================================================================
-- products
-- =========================================================================
DO $$ BEGIN
    CREATE TYPE stock_status_t AS ENUM ('in_stock', 'low_stock', 'out_of_stock');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS products (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_es          VARCHAR(200) NOT NULL,
    name_en          VARCHAR(200) NOT NULL,
    description_es   TEXT,
    description_en   TEXT,
    category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
    retail_price     NUMERIC(10, 2) NOT NULL DEFAULT 0,
    wholesale_price  NUMERIC(10, 2) NOT NULL DEFAULT 0,
    pot_size         VARCHAR(40),
    stock_status     stock_status_t NOT NULL DEFAULT 'in_stock',
    promotion_text   VARCHAR(120),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_active        ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_category      ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured      ON products (is_featured);
CREATE INDEX IF NOT EXISTS idx_products_created_at    ON products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name_es       ON products (lower(name_es));
CREATE INDEX IF NOT EXISTS idx_products_name_en       ON products (lower(name_en));

-- =========================================================================
-- product_images
-- =========================================================================
CREATE TABLE IF NOT EXISTS product_images (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url          TEXT NOT NULL,
    alt_text     VARCHAR(200),
    sort_order   INTEGER NOT NULL DEFAULT 0,
    is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
    is_video     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product
    ON product_images (product_id, sort_order);

-- =========================================================================
-- admin_users
-- =========================================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email          VARCHAR(160) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    name           VARCHAR(120),
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- wholesale_access_logs
-- =========================================================================
CREATE TABLE IF NOT EXISTS wholesale_access_logs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    success      BOOLEAN NOT NULL,
    ip_address   VARCHAR(64),
    user_agent   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wholesale_logs_created
    ON wholesale_access_logs (created_at DESC);

-- =========================================================================
-- updated_at trigger helper
-- =========================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
