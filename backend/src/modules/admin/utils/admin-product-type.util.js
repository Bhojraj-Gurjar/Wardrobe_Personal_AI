import { inferProductTypeFromMetadata } from '../../products/constants/product-type.constants';

const PLACEHOLDER_PRODUCT_TYPE = 'T-Shirt';

/**
 * Returns the product_type stored in the database without inference or defaults.
 * @param {object} product
 * @returns {string|null}
 */
export function resolveStoredAdminProductType(product) {
  const stored = typeof product?.product_type === 'string'
    ? product.product_type.trim()
    : '';

  return stored || null;
}

/**
 * Detects rows that still carry the legacy Prisma default even though metadata implies another type.
 * @param {object} product
 * @param {string|null} storedType
 * @returns {boolean}
 */
export function isLikelyPlaceholderProductType(product, storedType = product?.product_type) {
  if (storedType !== PLACEHOLDER_PRODUCT_TYPE) {
    return false;
  }

  const inferred = inferProductTypeFromMetadata(product);
  return Boolean(inferred && inferred !== PLACEHOLDER_PRODUCT_TYPE);
}

/**
 * Admin list/detail display helper — never falls back to a hardcoded T-Shirt.
 * Legacy placeholder defaults surface the inferred merchandising type for display only.
 * @param {object} product
 * @returns {string|null}
 */
export function resolveAdminProductTypeDisplay(product) {
  const stored = resolveStoredAdminProductType(product);

  if (!stored) {
    return null;
  }

  if (isLikelyPlaceholderProductType(product, stored)) {
    const inferred = inferProductTypeFromMetadata(product);
    return inferred && inferred !== PLACEHOLDER_PRODUCT_TYPE ? inferred : null;
  }

  return stored;
}
