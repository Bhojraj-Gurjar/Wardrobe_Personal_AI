const { config: loadEnv } = require('dotenv');
const { resolve } = require('node:path');
const { createCuratedProductSeeder } = require('./lib/curated-product-seed.util.cjs');
const {
  CURATED_FOOTWEAR_PRODUCTS,
  CURATED_FOOTWEAR_ASSETS_DIR,
  CURATED_FOOTWEAR_UPLOAD_DIR,
} = require('./lib/curated-footwear-products.seed.cjs');

loadEnv({ path: resolve(__dirname, '../.env') });

const seeder = createCuratedProductSeeder({
  products: CURATED_FOOTWEAR_PRODUCTS,
  assetsDir: CURATED_FOOTWEAR_ASSETS_DIR,
  uploadDir: CURATED_FOOTWEAR_UPLOAD_DIR,
  label: 'Curated Footwear Product',
  subcategoryFilter: 'footwear',
  occasionTags: ['casual', 'outdoor'],
  defaultStyleTag: 'footwear',
});

seeder.run().catch((error) => {
  console.error(error);
  process.exit(1);
});
