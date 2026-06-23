/**
 * Stable catalog identity contract.
 * SKU is the immutable business key; product UUID is derived once and never rotated.
 */

export const CATALOG_ID_NAMESPACE_SEED = 'wardrobe-ai:catalog:v1';

/** SKU prefix for seeded catalog products. */
export const CATALOG_SKU_PREFIX = 'WA-';

export const PRODUCT_REFERENCE_FIELDS = [
  'id',
  'sku',
];

/**
 * Cross-module integration targets that consume stable product references.
 */
export const PRODUCT_INTEGRATION_TARGETS = [
  'fashionDna',
  'digitalAvatar',
  'recommendation',
  'virtualTryOn',
];
