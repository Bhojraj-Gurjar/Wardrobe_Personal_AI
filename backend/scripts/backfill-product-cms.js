const { config: loadEnv } = require('dotenv');
const { resolve } = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

loadEnv({ path: resolve(__dirname, '../.env') });

const LEGACY_CATEGORY_MAP = {
  Tops: 'Clothing',
  Bottoms: 'Clothing',
  Outerwear: 'Clothing',
  Footwear: 'Footwear',
  Accessories: 'Accessories',
};

function deriveStockFromSku(sku = '') {
  let hash = 0;
  for (let index = 0; index < sku.length; index += 1) {
    hash = (hash + sku.charCodeAt(index) * (index + 5)) % 1000;
  }
  return 50 + (hash % 200);
}

function parseSizeOptions(sizeOptions) {
  if (!sizeOptions) {
    return ['M'];
  }

  if (Array.isArray(sizeOptions)) {
    return sizeOptions.length ? sizeOptions.map(String) : ['M'];
  }

  if (typeof sizeOptions === 'object' && Array.isArray(sizeOptions.sizes)) {
    return sizeOptions.sizes.map(String);
  }

  return ['M'];
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const products = await prisma.product.findMany({
    include: { variants: true, images: true },
  });

  let updated = 0;
  let variantsCreated = 0;

  for (const product of products) {
    const category = LEGACY_CATEGORY_MAP[product.category] || product.category;
    const stockQuantity = product.stock_quantity > 0
      ? product.stock_quantity
      : deriveStockFromSku(product.sku);

    await prisma.product.update({
      where: { id: product.id },
      data: {
        category,
        stock_quantity: stockQuantity,
        visibility: product.is_active ? 'PUBLISHED' : 'HIDDEN',
        mrp: product.mrp ?? product.price,
        discount_percent: product.discount_percent ?? 0,
      },
    });

    updated += 1;

    if (!product.variants.length) {
      const sizes = parseSizeOptions(product.size_options);
      const color = product.color || 'Black';

      for (const size of sizes) {
        const variantSku = `${product.sku}-${color.replace(/\s+/g, '').toUpperCase()}-${size}`;
        const existing = await prisma.productVariant.findUnique({ where: { sku: variantSku } });

        if (!existing) {
          await prisma.productVariant.create({
            data: {
              product_id: product.id,
              color,
              size: String(size),
              sku: variantSku,
              stock: Math.max(1, Math.floor(stockQuantity / sizes.length)),
            },
          });
          variantsCreated += 1;
        }
      }
    }
  }

  console.log(`Backfill complete: ${updated} products updated, ${variantsCreated} variants created.`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
