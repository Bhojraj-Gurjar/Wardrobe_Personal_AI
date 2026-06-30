const { existsSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const { config: loadEnv } = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const {
  markProductCatalogInitialized,
  shouldRunProductSeeds,
} = require('./lib/product-seed-guard.cjs');

loadEnv({ path: resolve(__dirname, '../.env') });

const PRODUCT_SEED_SCRIPTS = [
  'seed-try-on-products.js',
  'seed-curated-shirt-products.js',
  'seed-curated-tshirt-products.js',
  'seed-curated-pants-products.js',
  'seed-curated-jackets-products.js',
  'seed-curated-footwear-products.js',
];

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const shouldRun = await shouldRunProductSeeds(prisma);

    if (!shouldRun) {
      console.log('Skipping product seed — catalog already initialized.');
      return;
    }

    console.log('Initializing product catalog for first-time database setup...');

    for (const scriptName of PRODUCT_SEED_SCRIPTS) {
      const scriptPath = resolve(__dirname, scriptName);

      if (!existsSync(scriptPath)) {
        continue;
      }

      console.log(`Running ${scriptName}...`);
      const result = spawnSync('node', [scriptPath], {
        stdio: 'inherit',
        env: {
          ...process.env,
          PRODUCT_SEED_BOOTSTRAP: 'true',
        },
      });

      if (result.status !== 0) {
        console.warn(`${scriptName} failed (non-fatal).`);
      }
    }

    markProductCatalogInitialized();
    console.log('Product catalog initialization complete.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Product seed bootstrap failed:', error);
  process.exit(1);
});
