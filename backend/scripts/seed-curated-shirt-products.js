const { config: loadEnv } = require('dotenv');
const { resolve } = require('node:path');
const { createCuratedProductSeeder } = require('./lib/curated-product-seed.util.cjs');
const {
  CURATED_SHIRT_PRODUCTS,
  CURATED_SHIRT_ASSETS_DIR,
  CURATED_SHIRT_UPLOAD_DIR,
} = require('./lib/curated-shirt-products.seed.cjs');

loadEnv({ path: resolve(__dirname, '../.env') });

const seeder = createCuratedProductSeeder({
  products: CURATED_SHIRT_PRODUCTS,
  assetsDir: CURATED_SHIRT_ASSETS_DIR,
  uploadDir: CURATED_SHIRT_UPLOAD_DIR,
  label: 'Curated Shirt Product',
  subcategoryFilter: 'shirts',
  occasionTags: ['casual', 'smart-casual'],
  defaultStyleTag: 'shirt',
});

seeder.run().catch((error) => {
  console.error(error);
  process.exit(1);
});
