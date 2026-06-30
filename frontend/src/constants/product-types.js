/**
 * Product Type taxonomy — mirrors backend product-type.constants.js
 */

export const PRODUCT_UI_CATEGORIES = [
  'Tops',
  'Bottoms',
  'Outerwear',
  'Footwear',
  'Accessories',
];

export const PRODUCT_TYPES = [
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
];

export const PRODUCT_TYPES_BY_UI_CATEGORY = {
  Tops: ['T-Shirt', 'Shirt', 'Polo', 'Hoodie', 'Sweatshirt', 'Tank Top', 'Kurta'],
  Bottoms: ['Jeans', 'Chinos', 'Cargo Pants', 'Shorts', 'Joggers', 'Formal Pants'],
  Outerwear: ['Jacket', 'Blazer', 'Bomber Jacket'],
  Footwear: ['Sneakers', 'Running Shoes', 'Loafers', 'Boots', 'Sandals', 'Slippers'],
  Accessories: ['Watch', 'Belt', 'Cap', 'Backpack', 'Sunglasses'],
};

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
};

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

export function isValidProductType(value) {
  return PRODUCT_TYPES.includes(value);
}

export function getProductTypesForUiCategory(uiCategory) {
  return PRODUCT_TYPES_BY_UI_CATEGORY[uiCategory] || [];
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

export function resolveUiCategoryFromProductType(productType) {
  for (const [uiCategory, types] of Object.entries(PRODUCT_TYPES_BY_UI_CATEGORY)) {
    if (types.includes(productType)) {
      return uiCategory;
    }
  }

  return null;
}
