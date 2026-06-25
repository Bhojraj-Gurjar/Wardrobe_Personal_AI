const { config: loadEnv } = require('dotenv');
const { resolve } = require('node:path');
const { createCuratedProductSeeder } = require('./lib/curated-product-seed.util.cjs');
const {
  CURATED_PANT_PRODUCTS,
  CURATED_PANT_ASSETS_DIR,
  CURATED_PANT_UPLOAD_DIR,
} = require('./lib/curated-pants-products.seed.cjs');

loadEnv({ path: resolve(__dirname, '../.env') });

const seeder = createCuratedProductSeeder({
  products: CURATED_PANT_PRODUCTS,
  assetsDir: CURATED_PANT_ASSETS_DIR,
  uploadDir: CURATED_PANT_UPLOAD_DIR,
  label: 'Curated Pants Product',
  subcategoryFilter: 'pants',
  occasionTags: ['casual', 'smart-casual'],
  defaultStyleTag: 'pants',
});

seeder.run().catch((error) => {
  console.error(error);
  process.exit(1);
});
