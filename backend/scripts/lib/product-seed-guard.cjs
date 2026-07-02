const { existsSync, readFileSync } = require('node:fs');
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

function normalizeSku(sku) {
  return String(sku || '').trim().toUpperCase();
}

function loadSuppressionsFromFile() {
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

async function loadSuppressedSkus(prisma) {
  const suppressed = loadSuppressionsFromFile();

  if (!prisma?.seedSuppressedSku) {
    return suppressed;
  }

  try {
    const rows = await prisma.seedSuppressedSku.findMany({
      select: { sku: true },
    });

    for (const row of rows) {
      const normalized = normalizeSku(row.sku);
      if (normalized) {
        suppressed.add(normalized);
      }
    }
  } catch (error) {
    console.warn('[product-seed-guard] Failed to load DB suppressions:', error.message);
  }

  return suppressed;
}

function isSkuSeedSuppressed(sku, suppressedSkus) {
  const normalized = normalizeSku(sku);
  return normalized ? suppressedSkus.has(normalized) : false;
}

async function recordSeedSuppression(prisma, sku) {
  const normalized = normalizeSku(sku);

  if (!normalized || !prisma?.seedSuppressedSku) {
    return;
  }

  try {
    await prisma.seedSuppressedSku.upsert({
      where: { sku: normalized },
      update: {},
      create: { sku: normalized },
    });
  } catch (error) {
    console.warn(
      `[product-seed-guard] Failed to record seed suppression for SKU ${normalized}:`,
      error.message,
    );
  }
}

function isProductCatalogInitialized() {
  return existsSync(getInitMarkerPath());
}

function markProductCatalogInitialized() {
  const { mkdirSync, writeFileSync } = require('node:fs');
  mkdirSync(getSystemDir(), { recursive: true });
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
  loadSuppressedSkus,
  markProductCatalogInitialized,
  normalizeSku,
  recordSeedSuppression,
  shouldRunProductSeeds,
};
