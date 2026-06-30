const { config: loadEnv } = require('dotenv');
const { resolve } = require('node:path');
const { createCuratedProductSeeder } = require('./lib/curated-product-seed.util.cjs');
const {
  CURATED_TSHIRT_PRODUCTS,
  CURATED_TSHIRT_ASSETS_DIR,
  CURATED_TSHIRT_UPLOAD_DIR,
} = require('./lib/curated-tshirt-products.seed.cjs');

loadEnv({ path: resolve(__dirname, '../.env') });

const seeder = createCuratedProductSeeder({
  products: CURATED_TSHIRT_PRODUCTS,
  assetsDir: CURATED_TSHIRT_ASSETS_DIR,
  uploadDir: CURATED_TSHIRT_UPLOAD_DIR,
  label: 'Curated T-Shirt Product',
  subcategoryFilter: 't-shirts',
  occasionTags: ['casual', 'streetwear'],
  defaultStyleTag: 't-shirt',
});

seeder.run().catch((error) => {
  console.error(error);
  process.exit(1);
});
