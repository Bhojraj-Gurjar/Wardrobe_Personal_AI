/**
 * Remove catalog products seeded from brand website links / stock photos.
 * Keeps only manually curated Wardrobe AI Collection products (TRYON-WAC-*).
 *
 * Usage: node backend/scripts/remove-link-seeded-products.js
 */

const { config: loadEnv } = require('dotenv');
const { resolve } = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

loadEnv({ path: resolve(__dirname, '../.env') });

const KEEP_SKU_PREFIX = 'TRYON-WAC-';

async function main() {
  const connectionString =
    process.env.DATABASE_URL
    || 'postgresql://wardrobe:wardrobe@localhost:5432/wardrobe_db';

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const toRemove = await prisma.product.findMany({
      where: {
        NOT: {
          sku: { startsWith: KEEP_SKU_PREFIX },
        },
      },
      select: { id: true, sku: true, name: true },
      orderBy: { sku: 'asc' },
    });

    if (!toRemove.length) {
      console.log('No link-seeded products to remove.');
      return;
    }

    console.log(`Removing ${toRemove.length} non-curated products...`);
    for (const product of toRemove) {
      console.log(`  - ${product.sku}: ${product.name}`);
    }

    const result = await prisma.product.deleteMany({
      where: {
        NOT: {
          sku: { startsWith: KEEP_SKU_PREFIX },
        },
      },
    });

    const remaining = await prisma.product.count();
    console.log(`\nDeleted ${result.count} products. ${remaining} curated products remain.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
