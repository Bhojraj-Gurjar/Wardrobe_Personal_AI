const { config: loadEnv } = require('dotenv');
const { resolve } = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const {
  TRYON_SKU_PREFIX,
  TRY_ON_PRODUCT_SEED,
} = require('./lib/try-on-products.seed.cjs');
const { isSkuSeedSuppressed } = require('./lib/product-seed-guard.cjs');
const { inferProductTypeFromMetadata } = require('../src/modules/products/constants/product-type.constants');

loadEnv({ path: resolve(__dirname, '../.env') });

async function ensureTryOnSchema(pool) {
  await pool.query(`
    ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "try_on_image" VARCHAR(2048),
      ADD COLUMN IF NOT EXISTS "is_try_on_compatible" BOOLEAN;
  `);
}

function mapProductData(product) {
  const category = product.category;
  const brand = product.brand;
  const tryOnImage = product.tryOnImage || product.imageUrl;

  return {
    sku: product.sku,
    name: product.name,
    description: product.description ?? null,
    category,
    subcategory: product.subcategory,
    product_type: product.productType ?? inferProductTypeFromMetadata(product),
    gender: product.gender,
    brand,
    category_id: category,
    brand_id: brand,
    price: product.price,
    currency: product.currency ?? 'INR',
    color: product.color ?? null,
    size_options: product.sizeOptions ?? ['S', 'M', 'L', 'XL'],
    fabric: product.fabric ?? null,
    fit_type: product.fitType ?? null,
    style_tags: product.styleTags ?? ['try-on', 'catalog'],
    occasion_tags: product.occasionTags ?? ['casual'],
    image_url: product.imageUrl ?? null,
    try_on_image: tryOnImage,
    is_try_on_compatible: product.isTryOnCompatible ?? true,
    product_url: product.productUrl ?? null,
    is_active: product.isActive ?? true,
  };
}

function mapImages(product) {
  const url = product.tryOnImage || product.imageUrl;

  if (!url) {
    return [];
  }

  return [{
    url,
    sort_order: 0,
    is_primary: true,
  }];
}

async function upsertProduct(prisma, product) {
  if (isSkuSeedSuppressed(product.sku)) {
    return null;
  }

  const data = mapProductData(product);
  const images = mapImages(product);
  const existing = await prisma.product.findUnique({
    where: { sku: product.sku },
    select: { id: true, cms_metadata: true },
  });

  if (existing?.cms_metadata?.adminDeleted) {
    return existing;
  }

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
    await ensureTryOnSchema(pool);

    let seeded = 0;
    let created = 0;
    let updated = 0;

    for (const product of TRY_ON_PRODUCT_SEED) {
      if (!product.sku?.startsWith(TRYON_SKU_PREFIX)) {
        throw new Error(`Invalid try-on SKU: ${product.sku}`);
      }

      const before = await prisma.product.findUnique({
        where: { sku: product.sku },
        select: { id: true },
      });

      await upsertProduct(prisma, product);
      seeded += 1;

      if (before) {
        updated += 1;
      } else {
        created += 1;
      }
    }

    const compatibleCount = await prisma.product.count({
      where: { is_try_on_compatible: true },
    });

    console.log(
      `Try-On product seed complete: ${seeded} products (${created} created, ${updated} updated).`,
    );
    console.log(`Total try-on compatible products in database: ${compatibleCount}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
