const { config: loadEnv } = require('dotenv');
const { resolve } = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const {
  PRODUCT_CATEGORY_GROUP_SEED,
} = require('../src/modules/products/constants/product-category.seed.js');

loadEnv({ path: resolve(__dirname, '../.env') });

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  let groupsSeeded = 0;
  let categoriesSeeded = 0;

  try {
    for (const groupSeed of PRODUCT_CATEGORY_GROUP_SEED) {
      const group = await prisma.productCategoryGroup.upsert({
        where: { code: groupSeed.code },
        create: {
          code: groupSeed.code,
          name: groupSeed.name,
          description: groupSeed.description ?? null,
          sort_order: groupSeed.sort_order ?? 0,
          is_active: true,
        },
        update: {
          name: groupSeed.name,
          description: groupSeed.description ?? null,
          sort_order: groupSeed.sort_order ?? 0,
        },
      });

      groupsSeeded += 1;

      for (const categorySeed of groupSeed.categories || []) {
        await prisma.productCategory.upsert({
          where: { slug: categorySeed.slug },
          create: {
            group_id: group.id,
            slug: categorySeed.slug,
            name: categorySeed.name,
            sort_order: categorySeed.sort_order ?? 0,
            is_active: true,
          },
          update: {
            group_id: group.id,
            name: categorySeed.name,
            sort_order: categorySeed.sort_order ?? 0,
          },
        });

        categoriesSeeded += 1;
      }
    }

    console.log(`Seeded ${groupsSeeded} groups and ${categoriesSeeded} categories.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
