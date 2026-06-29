const { resolve, join } = require('node:path');
const { existsSync, mkdirSync, copyFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

function createCuratedProductSeeder({
  products,
  assetsDir,
  uploadDir,
  label,
  subcategoryFilter,
  occasionTags = ['casual'],
  defaultStyleTag = 'curated',
}) {
  const BACKEND_ROOT = resolve(__dirname, '../..');
  const ASSETS_PATH = join(BACKEND_ROOT, assetsDir);
  const UPLOADS_ROOT = join(BACKEND_ROOT, process.env.STORAGE_LOCAL_ROOT || 'uploads');
  const PRODUCT_UPLOAD_DIR = join(UPLOADS_ROOT, uploadDir);
  const TRYON_UPLOAD_DIR = join(PRODUCT_UPLOAD_DIR, 'tryon');
  const PYTHON_SCRIPT = join(BACKEND_ROOT, 'python', 'remove_garment_background.py');

  function toPublicPath(relativePath) {
    return `/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  function ensureDirectories() {
    mkdirSync(PRODUCT_UPLOAD_DIR, { recursive: true });
    mkdirSync(TRYON_UPLOAD_DIR, { recursive: true });
  }

  function copyOriginalAsset(assetFileName) {
    const sourcePath = join(ASSETS_PATH, assetFileName);

    if (!existsSync(sourcePath)) {
      throw new Error(`Missing curated asset: ${sourcePath}`);
    }

    const destinationPath = join(PRODUCT_UPLOAD_DIR, assetFileName);
    copyFileSync(sourcePath, destinationPath);

    return {
      absolutePath: destinationPath,
      publicPath: toPublicPath(`${uploadDir}/${assetFileName}`),
    };
  }

  function generateTryOnImage(sourceAbsolutePath, sku) {
    const outputFileName = `${sku.toLowerCase()}-tryon.png`;
    const outputPath = join(TRYON_UPLOAD_DIR, outputFileName);

    if (!existsSync(PYTHON_SCRIPT)) {
      copyFileSync(sourceAbsolutePath, outputPath);
      return {
        absolutePath: outputPath,
        publicPath: toPublicPath(`${uploadDir}/tryon/${outputFileName}`),
        method: 'copy-fallback',
      };
    }

    const result = spawnSync(
      process.env.PYTHON_BIN || 'python',
      [PYTHON_SCRIPT, '--input', sourceAbsolutePath, '--output', outputPath],
      { encoding: 'utf8' },
    );

    if (result.status !== 0 || !existsSync(outputPath)) {
      copyFileSync(sourceAbsolutePath, outputPath);
      return {
        absolutePath: outputPath,
        publicPath: toPublicPath(`${uploadDir}/tryon/${outputFileName}`),
        method: 'copy-fallback',
        warning: (result.stderr || result.stdout || 'Background removal failed').trim(),
      };
    }

    return {
      absolutePath: outputPath,
      publicPath: toPublicPath(`${uploadDir}/tryon/${outputFileName}`),
      method: 'garment-background-removal',
    };
  }

  function mapProductData(product, imageUrl, tryOnImageUrl) {
    return {
      sku: product.sku,
      name: product.name,
      description: product.description ?? null,
      category: product.category,
      subcategory: product.subcategory,
      gender: product.gender,
      brand: product.brand,
      category_id: product.category,
      brand_id: product.brand,
      price: product.salePrice ?? product.price,
      currency: product.currency ?? 'INR',
      color: product.color ?? null,
      size_options: ['S', 'M', 'L', 'XL', 'XXL'],
      fabric: product.fabric ?? null,
      fit_type: product.fitType ?? null,
      style_tags: product.styleTags ?? [defaultStyleTag, 'try-on', product.subcategory],
      occasion_tags: occasionTags,
      image_url: imageUrl,
      try_on_image: tryOnImageUrl,
      is_try_on_compatible: product.isTryOnCompatible ?? true,
      is_active: product.isActive ?? true,
    };
  }

  function mapImages(imageUrl, tryOnImageUrl) {
    const images = [];

    if (imageUrl) {
      images.push({
        url: imageUrl,
        sort_order: 0,
        is_primary: true,
      });
    }

    if (tryOnImageUrl && tryOnImageUrl !== imageUrl) {
      images.push({
        url: tryOnImageUrl,
        sort_order: 1,
        is_primary: false,
      });
    }

    return images;
  }

  async function upsertProduct(prisma, product, imageUrl, tryOnImageUrl) {
    const data = mapProductData(product, imageUrl, tryOnImageUrl);
    const images = mapImages(imageUrl, tryOnImageUrl);
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

  async function ensureTryOnSchema(pool) {
    await pool.query(`
      ALTER TABLE "products"
        ADD COLUMN IF NOT EXISTS "try_on_image" VARCHAR(2048),
        ADD COLUMN IF NOT EXISTS "is_try_on_compatible" BOOLEAN;
    `);
  }

  async function run() {
    ensureDirectories();

    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    const summaries = [];

    try {
      await ensureTryOnSchema(pool);

      for (const product of products) {
        const original = copyOriginalAsset(product.assetFileName);
        const tryOn = generateTryOnImage(original.absolutePath, product.sku);

        const before = await prisma.product.findUnique({
          where: { sku: product.sku },
          select: { id: true },
        });

        await upsertProduct(prisma, product, original.publicPath, tryOn.publicPath);

        summaries.push({
          sku: product.sku,
          name: product.name,
          color: product.color,
          category: product.category,
          price: product.price,
          salePrice: product.salePrice,
          rating: product.rating,
          stock: product.stock,
          image: original.publicPath,
          tryOnImage: tryOn.publicPath,
          tryOnMethod: tryOn.method,
          created: !before,
        });
      }

      const compatibleCount = await prisma.product.count({
        where: {
          is_try_on_compatible: true,
          subcategory: subcategoryFilter,
        },
      });

      console.log(`\n=== ${label} Import Summary ===\n`);

      for (const item of summaries) {
        console.log(`Product: ${item.name} (${item.color})`);
        console.log(`  ✓ Product Created (${item.created ? 'new' : 'updated'})`);
        console.log(`  ✓ Category Assigned: ${item.category}`);
        console.log(`  ✓ Price Generated: ₹${item.price} (Sale: ₹${item.salePrice})`);
        console.log(`  ✓ Rating: ${item.rating} | Stock: ${item.stock}`);
        console.log('  ✓ Try-On Compatible');
        console.log(`  ✓ Added To Catalog: ${item.image}`);
        console.log(`  ✓ Added To Try-On: ${item.tryOnImage} [${item.tryOnMethod}]`);
        console.log(`  SKU: ${item.sku}\n`);
      }

      console.log(
        `${subcategoryFilter} try-on compatible products in database: ${compatibleCount}`,
      );
    } finally {
      await prisma.$disconnect();
      await pool.end();
    }
  }

  return { run };
}

module.exports = {
  createCuratedProductSeeder,
};
