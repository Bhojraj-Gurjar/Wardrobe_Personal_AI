#!/bin/sh
set -e

echo "Applying database schema..."
npx prisma db push --schema=prisma/schema.prisma --accept-data-loss

exec "$@"
