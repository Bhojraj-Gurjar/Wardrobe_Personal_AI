const { config: loadEnv } = require('dotenv');
const { resolve } = require('node:path');
const { createCuratedProductSeeder } = require('./lib/curated-product-seed.util.cjs');
const {
  CURATED_JACKET_PRODUCTS,
  CURATED_JACKET_ASSETS_DIR,
  CURATED_JACKET_UPLOAD_DIR,
} = require('./lib/curated-jackets-products.seed.cjs');

loadEnv({ path: resolve(__dirname, '../.env') });

const seeder = createCuratedProductSeeder({
  products: CURATED_JACKET_PRODUCTS,
  assetsDir: CURATED_JACKET_ASSETS_DIR,
  uploadDir: CURATED_JACKET_UPLOAD_DIR,
  label: 'Curated Jackets Product',
  subcategoryFilter: 'jackets',
  occasionTags: ['casual', 'outdoor'],
  defaultStyleTag: 'jacket',
});

seeder.run().catch((error) => {
  console.error(error);
  process.exit(1);
});
