const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');

function getStorageRoot() {
  return resolve(process.env.STORAGE_LOCAL_ROOT || 'uploads');
}

function getSystemDir() {
  return join(getStorageRoot(), '.system');
}

function getSuppressionFilePath() {
  return join(getSystemDir(), 'product-seed-suppressions.json');
}

function getInitMarkerPath() {
  return join(getSystemDir(), 'product-catalog-initialized');
}

function ensureSystemDir() {
  mkdirSync(getSystemDir(), { recursive: true });
}

function normalizeSku(sku) {
  return String(sku || '').trim().toUpperCase();
}

function loadSuppressions() {
  const filePath = getSuppressionFilePath();

  if (!existsSync(filePath)) {
    return new Set();
  }

  try {
    const payload = JSON.parse(readFileSync(filePath, 'utf8'));
    const skus = Array.isArray(payload?.suppressedSkus) ? payload.suppressedSkus : [];
    return new Set(skus.map(normalizeSku).filter(Boolean));
  } catch {
    return new Set();
  }
}

function isSkuSeedSuppressed(sku) {
  const normalized = normalizeSku(sku);
  return normalized ? loadSuppressions().has(normalized) : false;
}

function recordSeedSuppression(sku) {
  const normalized = normalizeSku(sku);

  if (!normalized) {
    return;
  }

  const suppressions = loadSuppressions();

  if (suppressions.has(normalized)) {
    return;
  }

  suppressions.add(normalized);
  ensureSystemDir();

  writeFileSync(
    getSuppressionFilePath(),
    JSON.stringify(
      {
        version: 1,
        suppressedSkus: [...suppressions].sort(),
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );
}

function isProductCatalogInitialized() {
  return existsSync(getInitMarkerPath());
}

function markProductCatalogInitialized() {
  ensureSystemDir();
  writeFileSync(getInitMarkerPath(), new Date().toISOString(), 'utf8');
}

async function getProductCount(prisma) {
  return prisma.product.count();
}

async function shouldRunProductSeeds(prisma) {
  if (process.env.SEED_PRODUCTS_ON_STARTUP === 'true') {
    return true;
  }

  if (isProductCatalogInitialized()) {
    return false;
  }

  const count = await getProductCount(prisma);

  if (count > 0) {
    markProductCatalogInitialized();
    return false;
  }

  return true;
}

module.exports = {
  getProductCount,
  isProductCatalogInitialized,
  isSkuSeedSuppressed,
  markProductCatalogInitialized,
  recordSeedSuppression,
  shouldRunProductSeeds,
};
