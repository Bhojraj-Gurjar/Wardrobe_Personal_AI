/**
 * Virtual try-on layer compositing order (back → front).
 * BODY → PANTS → SHIRT/T-SHIRT → JACKET → SHOES
 */

export const TRY_ON_CATEGORIES = [
  { id: 'pants', label: 'Pants', slot: 'pants', zIndex: 20 },
  { id: 't-shirts', label: 'T-Shirts', slot: 'tshirt', zIndex: 30 },
  { id: 'shirts', label: 'Shirts', slot: 'shirt', zIndex: 35 },
  { id: 'jackets', label: 'Jackets', slot: 'jacket', zIndex: 40 },
  { id: 'shoes', label: 'Shoes', slot: 'shoes', zIndex: 50 },
];

export const TRY_ON_LAYER_STACK = [
  { layerId: 'body', label: 'Body', zIndex: 10 },
  ...TRY_ON_CATEGORIES.map((category) => ({
    layerId: category.slot,
    categoryId: category.id,
    outfitSlot: category.slot,
    label: category.label,
    zIndex: category.zIndex,
  })),
];

export const CATEGORY_TO_TRY_ON_SLOT = Object.fromEntries(
  TRY_ON_CATEGORIES.map((category) => [category.id, category.slot]),
);

export const EMPTY_TRY_ON_OUTFIT = {
  pants: null,
  tshirt: null,
  shirt: null,
  jacket: null,
  shoes: null,
};

/** Body-type scaling hints for clothing overlays. */
export const BODY_TYPE_SCALING = {
  Athletic: { shoulder: 1.08, waist: 0.98, width: 1.04, height: 1.0 },
  ATHLETIC: { shoulder: 1.08, waist: 0.98, width: 1.04, height: 1.0 },
  Slim: { shoulder: 0.94, waist: 0.92, width: 0.94, height: 1.0 },
  SLIM: { shoulder: 0.94, waist: 0.92, width: 0.94, height: 1.0 },
  Muscular: { shoulder: 1.12, waist: 1.0, width: 1.08, height: 1.02 },
  Average: { shoulder: 1.0, waist: 1.0, width: 1.0, height: 1.0 },
  AVERAGE: { shoulder: 1.0, waist: 1.0, width: 1.0, height: 1.0 },
  Curvy: { shoulder: 0.98, waist: 1.06, width: 1.02, height: 1.0 },
  CURVY: { shoulder: 0.98, waist: 1.06, width: 1.02, height: 1.0 },
  'Plus Size': { shoulder: 1.04, waist: 1.1, width: 1.08, height: 1.0 },
  PLUS_SIZE: { shoulder: 1.04, waist: 1.1, width: 1.08, height: 1.0 },
};

export const DEFAULT_BODY_SCALING = BODY_TYPE_SCALING.Average;
