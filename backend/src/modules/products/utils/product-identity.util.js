import { createHash } from 'node:crypto';
import { CATALOG_ID_NAMESPACE_SEED, CATALOG_SKU_PREFIX } from '../constants/product-identity.constants';

function toUuidFromHash(hashHex) {
  const variant = ((parseInt(hashHex.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, '0');

  return [
    hashHex.slice(0, 8),
    hashHex.slice(8, 12),
    `4${hashHex.slice(13, 16)}`,
    `${variant}${hashHex.slice(18, 20)}`,
    hashHex.slice(20, 32),
  ].join('-');
}

export function resolveStableProductId(sku) {
  const hash = createHash('sha256')
    .update(`${CATALOG_ID_NAMESPACE_SEED}:${sku}`)
    .digest('hex');

  return toUuidFromHash(hash);
}

export function isCatalogSku(sku) {
  return typeof sku === 'string' && sku.startsWith(CATALOG_SKU_PREFIX);
}

export function assertSkuIsImmutable(existingSku, nextSku) {
  if (nextSku !== undefined && nextSku !== existingSku) {
    throw new Error('SKU is immutable after product creation');
  }
}

export function resolveProductReference(product) {
  return {
    productId: product.id,
    sku: product.sku,
  };
}
