#!/bin/sh
set -e

if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/uploads/products
  chown -R nodejs:nodejs /app/uploads
fi

if [ -x ./node_modules/.bin/prisma ]; then
  echo "Applying database schema..."
  npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
else
  echo "Prisma CLI not available in runtime image — skipping schema push."
fi

if [ -f ./scripts/seed-admin.js ]; then
  echo "Ensuring default admin account..."
  node scripts/seed-admin.js || echo "Admin seed skipped (non-fatal)."
fi

if [ -f ./scripts/seed-try-on-products.js ]; then
  echo "Seeding Try-On compatible products..."
  node scripts/seed-try-on-products.js || echo "Try-On product seed skipped (non-fatal)."
fi

if [ -f ./scripts/seed-curated-shirt-products.js ]; then
  echo "Seeding curated Wardrobe AI shirt products..."
  node scripts/seed-curated-shirt-products.js || echo "Curated shirt seed skipped (non-fatal)."
fi

if [ -f ./scripts/seed-curated-tshirt-products.js ]; then
  echo "Seeding curated Wardrobe AI t-shirt products..."
  node scripts/seed-curated-tshirt-products.js || echo "Curated t-shirt seed skipped (non-fatal)."
fi

if [ -f ./scripts/seed-curated-pants-products.js ]; then
  echo "Seeding curated Wardrobe AI pants products..."
  node scripts/seed-curated-pants-products.js || echo "Curated pants seed skipped (non-fatal)."
fi

if [ -f ./scripts/seed-curated-jackets-products.js ]; then
  echo "Seeding curated Wardrobe AI jacket products..."
  node scripts/seed-curated-jackets-products.js || echo "Curated jacket seed skipped (non-fatal)."
fi

if [ -f ./scripts/seed-curated-footwear-products.js ]; then
  echo "Seeding curated Wardrobe AI footwear products..."
  node scripts/seed-curated-footwear-products.js || echo "Curated footwear seed skipped (non-fatal)."
fi

if [ "$(id -u)" = "0" ]; then
  exec gosu nodejs "$@"
fi

exec "$@"
