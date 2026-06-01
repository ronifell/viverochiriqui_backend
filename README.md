# Vivero Chiriquí — Backend API

REST API for the Vivero Chiriquí digital nursery catalog. Built with **Node.js**, **Express**, and **PostgreSQL**.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy and edit environment variables
cp .env.example .env

# 3. Create the PostgreSQL database (one-time)
createdb viverochiriqui

# 4. Initialize tables and bootstrap an admin user
npm run db:init

# 5. (Optional) Seed sample categories and products
npm run db:seed

# 6. Run the dev server
npm run dev
```

The API listens on `http://localhost:4000` by default.

## Environment variables

See `.env.example`. Important ones:

| Variable             | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string. Takes precedence over the `PG*` vars. |
| `JWT_SECRET`         | Secret for signing wholesale/admin tokens.                        |
| `WHOLESALE_PASSWORD` | Plain password customers enter to unlock wholesale prices.        |
| `ADMIN_EMAIL`        | Email of the bootstrap admin (created on first `db:init`).        |
| `ADMIN_PASSWORD`     | Password of the bootstrap admin.                                  |
| `FRONTEND_ORIGIN`    | CORS origin allowed for the frontend.                             |
| `PUBLIC_BASE_URL`    | Public URL where uploads are served (used to build image URLs).   |
| `MAX_UPLOAD_MB`      | Maximum upload size in MB.                                        |

## Endpoints (summary)

### Public

```
GET  /health
GET  /api/categories
GET  /api/products?category=&q=&featured=1&stock=&sort=&page=&limit=
GET  /api/products/:id
POST /api/auth/wholesale  { password }
POST /api/auth/admin      { email, password }
GET  /api/auth/me         (Bearer token optional)
```

### Admin (Bearer token, role=admin)

```
POST   /api/admin/upload         multipart/form-data, field "files"
POST   /api/products             body matches product schema
PATCH  /api/products/:id
DELETE /api/products/:id
POST   /api/products/:id/images
DELETE /api/products/:id/images/:imageId
POST   /api/products/:id/images/:imageId/primary
POST   /api/categories
PATCH  /api/categories/:id
DELETE /api/categories/:id
```

### Auth

- Wholesale: `POST /api/auth/wholesale` → returns a JWT with `role=wholesale`.
- Admin: `POST /api/auth/admin` → returns a JWT with `role=admin`.

Send the token via `Authorization: Bearer <token>`. Wholesale tokens unlock the `wholesale_price` field on products. Public callers never see wholesale prices.

## Project layout

```
src/
  config/env.js           # Env loader
  controllers/            # Route handlers
  middleware/             # Auth, errors, file uploads
  routes/                 # Express routers
  db/
    schema.sql            # PostgreSQL schema
    init.js               # Run schema + bootstrap admin
    seed.js               # Demo categories/products
    reset.js              # DROP everything (dev only)
    pool.js               # pg pool
  utils/                  # asyncHandler, HttpError
  app.js                  # Express app
  server.js               # Entry point
uploads/                  # Local image/video storage
```

## Image uploads

`POST /api/admin/upload` accepts `multipart/form-data` with one or more files in the `files` field. Images are auto-converted to WebP (max 1600px) and stored locally; videos are saved as-is. The endpoint returns `{ url, is_video }` per file. The frontend then attaches the URL to a product via `POST /api/products/:id/images`.

For production deployments, point `UPLOAD_DIR` to a persistent volume or replace the controller with an S3/Cloudflare R2 uploader.
