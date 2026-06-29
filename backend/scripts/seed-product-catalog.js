const { config: loadEnv } = require('dotenv');
const { resolve } = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const { PRODUCT_CATALOG_SEED } = require('../src/modules/products/constants/product-catalog.seed.js');
const { isCatalogSku } = require('./lib/product-identity.cjs');
const { inferProductType } = require('../src/modules/products/constants/product-type.constants');

loadEnv({ path: resolve(__dirname, '../.env') });

function mapProductData(product) {
  const category = product.category;
  const brand = product.brand;

  return {
    sku: product.sku,
    name: product.name,
    description: product.description ?? null,
    category,
    subcategory: product.subcategory,
    product_type: product.productType ?? inferProductType(product),
    gender: product.gender,
    brand,
    category_id: category,
    brand_id: brand,
    price: product.price,
    currency: product.currency ?? 'INR',
    color: product.color ?? null,
    size_options: product.sizeOptions ?? [],
    fabric: product.fabric ?? null,
    fit_type: product.fitType ?? null,
    style_tags: product.styleTags ?? [],
    occasion_tags: product.occasionTags ?? [],
    image_url: product.imageUrl ?? null,
    product_url: product.productUrl ?? null,
    avatar_category: product.avatarCategory ?? null,
    overlay_order: product.overlayOrder ?? null,
    is_active: product.isActive ?? true,
  };
}

function mapImages(product) {
  if (!product.imageUrl) {
    return [];
  }

  return [{
    url: product.imageUrl,
    sort_order: 0,
    is_primary: true,
  }];
}

async function upsertProduct(prisma, product) {
  const data = mapProductData(product);
  const images = mapImages(product);
  const existing = await prisma.product.findUnique({
    where: { sku: product.sku },
    select: { id: true },
  });

  if (existing) {
    return prisma.product.update({
      where: { sku: product.sku },
      data: {
        ...data,
        images: {
          deleteMany: {},
          create: images,
        },
      },
    });
  }

  return prisma.product.create({
    data: {
      id: product.id,
      ...data,
      images: images.length ? { create: images } : undefined,
    },
  });
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    let seeded = 0;
    let created = 0;
    let updated = 0;

    for (const product of PRODUCT_CATALOG_SEED) {
      if (!isCatalogSku(product.sku)) {
        throw new Error(`Invalid catalog SKU: ${product.sku}`);
      }

      const before = await prisma.product.findUnique({
        where: { sku: product.sku },
        select: { id: true },
      });

      await upsertProduct(prisma, product);
      seeded += 1;

      if (before) {
        if (before.id !== product.id) {
          console.warn(
            `Preserved existing product id for SKU ${product.sku} (${before.id}); stable id is ${product.id}`,
          );
        }
        updated += 1;
      } else {
        created += 1;
      }
    }

    const total = await prisma.product.count();
    console.log(
      `Catalog seed complete: ${seeded} products processed (${created} created, ${updated} updated, ${total} total).`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
