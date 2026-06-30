import {
  inferProductType,
  resolveCatvtonRegionFromProductType,
  resolveTryOnSlotFromProductType,
} from '../../products/constants/product-type.constants';

/** Pipeline order: lower body first, then inner tops, then outerwear. */
export const TRY_ON_PIPELINE_SLOTS = ['pants', 'tshirt', 'shirt', 'jacket', 'dress'];

const FOOTWEAR_SLOTS = new Set(['shoes']);

/**
 * @param {object} product
 * @returns {{ slot: string|null, region: 'upper'|'lower'|'dress'|null, productType: string }}
 */
export function resolveProductGarmentMeta(product) {
  const productType = inferProductType(product);
  const slot = resolveTryOnSlotFromProductType(productType);
  const region = resolveCatvtonRegionFromProductType(productType);

  return { slot, region, productType };
}

/**
 * Build an ordered garment plan for sequential CatVTON application.
 * @param {Array<object>} products
 * @returns {{
 *   mode: 'upper'|'lower'|'full',
 *   garments: Array<{ product: object, slot: string, region: string, productType: string }>,
 *   unsupported: Array<{ product: object, reason: string }>
 * }}
 */
export function buildTryOnGarmentPlan(products = []) {
  const slotMap = new Map();
  const unsupported = [];

  for (const product of products) {
    if (!product?.id) {
      continue;
    }

    const meta = resolveProductGarmentMeta(product);

    if (!meta.slot || !meta.region) {
      unsupported.push({
        product,
        reason: `${product.name || 'Product'} is not supported for AI virtual try-on.`,
      });
      continue;
    }

    if (FOOTWEAR_SLOTS.has(meta.slot)) {
      unsupported.push({
        product,
        reason: 'Footwear try-on uses avatar preview only. Remove shoes to continue with AI try-on.',
      });
      continue;
    }

    if (meta.slot === 'tshirt' || meta.slot === 'shirt') {
      slotMap.delete('tshirt');
      slotMap.delete('shirt');
    }

    slotMap.set(meta.slot, {
      product,
      slot: meta.slot,
      region: meta.region,
      productType: meta.productType,
    });
  }

  const garments = TRY_ON_PIPELINE_SLOTS
    .map((slot) => slotMap.get(slot))
    .filter(Boolean);

  const regions = new Set(garments.map((entry) => entry.region));

  let mode = 'upper';

  if (regions.has('lower') && regions.has('upper')) {
    mode = 'full';
  } else if (regions.has('lower')) {
    mode = 'lower';
  } else if (regions.has('dress')) {
    mode = 'full';
  }

  return { mode, garments, unsupported };
}

export function describeTryOnMode(mode) {
  switch (mode) {
    case 'lower':
      return 'Lower-body try-on';
    case 'full':
      return 'Full outfit try-on';
    default:
      return 'Upper-body try-on';
  }
}
