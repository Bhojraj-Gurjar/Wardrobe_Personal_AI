/**
 * Product Type taxonomy — distinct from Category (Tops, Bottoms, etc.).
 * Single source of truth for backend product-type logic.
 */

/** High-level UI / merchandising categories. */
export const PRODUCT_UI_CATEGORIES = [
  'Tops',
  'Bottoms',
  'Outerwear',
  'Footwear',
  'Accessories',
];

/** All supported product types (controlled vocabulary). */
export const PRODUCT_TYPES = [
  ...new Set([
    'T-Shirt',
    'Shirt',
    'Polo',
    'Hoodie',
    'Sweatshirt',
    'Tank Top',
    'Kurta',
    'Jacket',
    'Blazer',
    'Bomber Jacket',
    'Jeans',
    'Chinos',
    'Cargo Pants',
    'Shorts',
    'Joggers',
    'Formal Pants',
    'Sneakers',
    'Running Shoes',
    'Loafers',
    'Boots',
    'Sandals',
    'Slippers',
    'Watch',
    'Belt',
    'Cap',
    'Backpack',
    'Sunglasses',
    'Overshirt',
    'Sweater',
    'Suit',
    'Sherwani',
    'Cargo',
    'Trouser',
    'Track Pant',
    'Co-ord Set',
    'Innerwear',
    'Formal Shoes',
    'Slides',
    'Flip Flops',
    'Wallet',
    'Scarf',
    'Tote Bag',
    'Crossbody Bag',
    'Necklace',
    'Bracelet',
    'Ring',
    'Earrings',
    'Analog Watch',
    'Smartwatch',
    'Eyeglasses',
  ]),
];

/** Product types available per UI category (admin dropdown). */
export const PRODUCT_TYPES_BY_UI_CATEGORY = {
  Tops: ['T-Shirt', 'Shirt', 'Polo', 'Hoodie', 'Sweatshirt', 'Tank Top', 'Kurta'],
  Bottoms: ['Jeans', 'Chinos', 'Cargo Pants', 'Shorts', 'Joggers', 'Formal Pants'],
  Outerwear: ['Jacket', 'Blazer', 'Bomber Jacket'],
  Footwear: ['Sneakers', 'Running Shoes', 'Loafers', 'Boots', 'Sandals', 'Slippers'],
  Accessories: ['Watch', 'Belt', 'Cap', 'Backpack', 'Sunglasses'],
};

/** Map UI category → legacy DB category group code. */
export const UI_CATEGORY_TO_DB_GROUP = {
  Tops: 'MEN',
  Bottoms: 'MEN',
  Outerwear: 'MEN',
  Footwear: 'FOOTWEAR',
  Accessories: 'ACCESSORIES',
};

/** Map product type → avatar wear slot (AvatarCategory enum value). */
export const PRODUCT_TYPE_TO_AVATAR_CATEGORY = {
  'T-Shirt': 'TOP',
  Shirt: 'TOP',
  Polo: 'TOP',
  Hoodie: 'TOP',
  Sweatshirt: 'TOP',
  'Tank Top': 'TOP',
  Kurta: 'TOP',
  Jacket: 'JACKET',
  Blazer: 'JACKET',
  'Bomber Jacket': 'JACKET',
  Jeans: 'BOTTOM',
  Chinos: 'BOTTOM',
  'Cargo Pants': 'BOTTOM',
  Shorts: 'BOTTOM',
  Joggers: 'BOTTOM',
  'Formal Pants': 'BOTTOM',
  Sneakers: 'FOOTWEAR',
  'Running Shoes': 'FOOTWEAR',
  Loafers: 'FOOTWEAR',
  Boots: 'FOOTWEAR',
  Sandals: 'FOOTWEAR',
  Slippers: 'FOOTWEAR',
  Watch: 'ACCESSORY',
  Belt: 'ACCESSORY',
  Cap: 'ACCESSORY',
  Backpack: 'ACCESSORY',
  Sunglasses: 'ACCESSORY',
};

/** Map product type → digital-avatar outfit slot key. */
export const PRODUCT_TYPE_TO_OUTFIT_SLOT = {
  'T-Shirt': 'tshirt',
  Shirt: 'shirt',
  Polo: 'tshirt',
  Hoodie: 'tshirt',
  Sweatshirt: 'tshirt',
  'Tank Top': 'tshirt',
  Kurta: 'shirt',
  Jacket: 'jacket',
  Blazer: 'jacket',
  'Bomber Jacket': 'jacket',
  Jeans: 'pants',
  Chinos: 'pants',
  'Cargo Pants': 'pants',
  Shorts: 'pants',
  Joggers: 'pants',
  'Formal Pants': 'pants',
  Sneakers: 'shoes',
  'Running Shoes': 'shoes',
  Loafers: 'shoes',
  Boots: 'shoes',
  Sandals: 'shoes',
  Slippers: 'shoes',
};

/** Map product type → virtual try-on outfit slot key. */
export const PRODUCT_TYPE_TO_TRY_ON_SLOT = {
  'T-Shirt': 'tshirt',
  Shirt: 'shirt',
  Polo: 'tshirt',
  Hoodie: 'tshirt',
  Sweatshirt: 'tshirt',
  'Tank Top': 'tshirt',
  Kurta: 'shirt',
  Jacket: 'jacket',
  Blazer: 'jacket',
  'Bomber Jacket': 'jacket',
  Jeans: 'pants',
  Chinos: 'pants',
  'Cargo Pants': 'pants',
  Shorts: 'pants',
  Joggers: 'pants',
  'Formal Pants': 'pants',
  Sneakers: 'shoes',
  'Running Shoes': 'shoes',
  Loafers: 'shoes',
  Boots: 'shoes',
  Sandals: 'shoes',
  Slippers: 'shoes',
};

/** Product types eligible for CatVTON virtual try-on (upper/lower body garments). */
export const TRY_ON_COMPATIBLE_PRODUCT_TYPES = new Set([
  'T-Shirt',
  'Shirt',
  'Polo',
  'Hoodie',
  'Sweatshirt',
  'Tank Top',
  'Kurta',
  'Jacket',
  'Blazer',
  'Bomber Jacket',
  'Jeans',
  'Chinos',
  'Cargo Pants',
  'Shorts',
  'Joggers',
  'Formal Pants',
]);

/** Subcategory slug → default product type (migration / seed). */
export const SUBCATEGORY_TO_PRODUCT_TYPE = {
  'men-t-shirts': 'T-Shirt',
  'men-shirts': 'Shirt',
  'men-jackets': 'Jacket',
  'men-jeans': 'Jeans',
  'men-trousers': 'Chinos',
  'men-suits': 'Formal Pants',
  watches: 'Watch',
  sunglasses: 'Sunglasses',
  bags: 'Backpack',
  belts: 'Belt',
  shoes: 'Loafers',
  sneakers: 'Sneakers',
  sandals: 'Sandals',
};

/** Keyword rules for inferring product type from name/title (ordered, first match wins). */
const NAME_INFERENCE_RULES = [
  { pattern: /\brunning\s+shoe/i, type: 'Running Shoes' },
  { pattern: /\bsneaker/i, type: 'Sneakers' },
  { pattern: /\bloafer/i, type: 'Loafers' },
  { pattern: /\bboot/i, type: 'Boots' },
  { pattern: /\bsandal/i, type: 'Sandals' },
  { pattern: /\bslipper/i, type: 'Slippers' },
  { pattern: /\bhoodie/i, type: 'Hoodie' },
  { pattern: /\bsweatshirt/i, type: 'Sweatshirt' },
  { pattern: /\bpolo\b/i, type: 'Polo' },
  { pattern: /\bt-?shirt|\btee\b|\btee\b/i, type: 'T-Shirt' },
  { pattern: /\btank\s+top/i, type: 'Tank Top' },
  { pattern: /\bkurta/i, type: 'Kurta' },
  { pattern: /\bblazer/i, type: 'Blazer' },
  { pattern: /\bbomber/i, type: 'Bomber Jacket' },
  { pattern: /\bjacket/i, type: 'Jacket' },
  { pattern: /\bjean/i, type: 'Jeans' },
  { pattern: /\bcargo/i, type: 'Cargo Pants' },
  { pattern: /\bjogger/i, type: 'Joggers' },
  { pattern: /\bshort/i, type: 'Shorts' },
  { pattern: /\bchino/i, type: 'Chinos' },
  { pattern: /\bformal\s+pant|\bdress\s+pant|\btrouser/i, type: 'Formal Pants' },
  { pattern: /\bpant/i, type: 'Chinos' },
  { pattern: /\bshirt/i, type: 'Shirt' },
  { pattern: /\bwatch/i, type: 'Watch' },
  { pattern: /\bbelt/i, type: 'Belt' },
  { pattern: /\bcap\b|\bhat\b/i, type: 'Cap' },
  { pattern: /\bbackpack|\bbag\b/i, type: 'Backpack' },
  { pattern: /\bsunglass/i, type: 'Sunglasses' },
  { pattern: /\bshoe/i, type: 'Sneakers' },
];

export function isValidProductType(value) {
  return PRODUCT_TYPES.includes(value);
}

export function isValidProductTypeOrCms(value) {
  return PRODUCT_TYPES.includes(value);
}

export function getProductTypesForUiCategory(uiCategory) {
  return PRODUCT_TYPES_BY_UI_CATEGORY[uiCategory] || [];
}

export function resolveUiCategoryForProductType(productType) {
  for (const [uiCategory, types] of Object.entries(PRODUCT_TYPES_BY_UI_CATEGORY)) {
    if (types.includes(productType)) {
      return uiCategory;
    }
  }

  return null;
}

export function resolveAvatarCategoryFromProductType(productType, fallback = null) {
  return PRODUCT_TYPE_TO_AVATAR_CATEGORY[productType] ?? fallback;
}

export function resolveOutfitSlotFromProductType(productType) {
  return PRODUCT_TYPE_TO_OUTFIT_SLOT[productType] ?? null;
}

export function resolveTryOnSlotFromProductType(productType) {
  return PRODUCT_TYPE_TO_TRY_ON_SLOT[productType] ?? null;
}

export function isTryOnCompatibleProductType(productType) {
  return TRY_ON_COMPATIBLE_PRODUCT_TYPES.has(productType);
}

/**
 * Infer product type from metadata only (ignores existing product_type).
 * Use for migrations/backfills.
 */
export function inferProductTypeFromMetadata(product = {}) {
  const name = String(product.name || product.sku || '');
  for (const rule of NAME_INFERENCE_RULES) {
    if (rule.pattern.test(name)) {
      return rule.type;
    }
  }

  if (product.subcategory && SUBCATEGORY_TO_PRODUCT_TYPE[product.subcategory]) {
    return SUBCATEGORY_TO_PRODUCT_TYPE[product.subcategory];
  }

  const avatarCategory = product.avatar_category || product.avatarCategory;
  if (avatarCategory === 'JACKET') return 'Jacket';
  if (avatarCategory === 'BOTTOM') return 'Jeans';
  if (avatarCategory === 'FOOTWEAR') return 'Sneakers';
  if (avatarCategory === 'ACCESSORY') return 'Watch';
  if (avatarCategory === 'TOP') return 'T-Shirt';

  const category = String(product.category || '').toUpperCase();
  if (category === 'FOOTWEAR') return 'Sneakers';
  if (category === 'ACCESSORIES') return 'Watch';

  return 'T-Shirt';
}

/**
 * Infer product type from existing product metadata (migration / fallback).
 * @param {{ name?: string, subcategory?: string, category?: string, avatar_category?: string }} product
 * @returns {string}
 */
export function inferProductType(product = {}) {
  if (product.product_type && isValidProductType(product.product_type)) {
    return product.product_type;
  }

  if (product.productType && isValidProductType(product.productType)) {
    return product.productType;
  }

  return inferProductTypeFromMetadata(product);
}
