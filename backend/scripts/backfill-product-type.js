/**
 * Backfill product_type for all existing products.
 * Run: npm run seed:backfill-product-type
 */
const { config: loadEnv } = require('dotenv');
const { resolve } = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const {
  inferProductTypeFromMetadata,
} = require('../src/modules/products/constants/product-type.constants');

loadEnv({ path: resolve(__dirname, '../.env') });

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        subcategory: true,
        avatar_category: true,
        product_type: true,
      },
    });

    let updated = 0;
    let skipped = 0;

    for (const product of products) {
      const inferred = inferProductTypeFromMetadata(product);

      if (product.product_type === inferred) {
        skipped += 1;
        continue;
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { product_type: inferred },
      });

      updated += 1;
      console.log(`[${product.sku}] ${product.name} → ${inferred}`);
    }

    console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}, total: ${products.length}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
