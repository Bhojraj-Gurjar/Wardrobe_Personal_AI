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

if [ -f ./scripts/run-product-seeds-on-first-init.js ]; then
  echo "Checking product catalog seed requirements..."
  node scripts/run-product-seeds-on-first-init.js || echo "Product seed skipped (non-fatal)."
fi

if [ "$(id -u)" = "0" ]; then
  exec gosu nodejs "$@"
fi

exec "$@"
