export const UI_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'tops', label: 'Tops' },
  { id: 'bottoms', label: 'Bottoms' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'footwear', label: 'Footwear' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'dresses', label: 'Dresses' },
  { id: 'activewear', label: 'Activewear' },
];

export const TOPBAR_CATEGORIES = UI_CATEGORIES.filter((category) =>
  ['all', 'tops', 'bottoms', 'outerwear', 'footwear'].includes(category.id),
);

export const SIDEBAR_CATEGORIES = UI_CATEGORIES.filter((category) =>
  ['all', 'tops', 'bottoms', 'outerwear', 'footwear', 'accessories'].includes(category.id),
);

export const PRICE_RANGE = {
  min: 0,
  max: 50000,
};

export const SORT_OPTIONS = [
  { id: 'best_match', label: 'Best Match' },
  { id: 'price_asc', label: 'Price Low to High' },
  { id: 'price_desc', label: 'Price High to Low' },
  { id: 'newest', label: 'Newest' },
  { id: 'most_popular', label: 'Most Popular' },
  { id: 'highest_rated', label: 'Highest Rated' },
  { id: 'discount', label: 'Discount' },
];

const SUBCATEGORY_UI_MAP = {
  'men-t-shirts': 'tops',
  'men-shirts': 'tops',
  'men-suits': 'tops',
  'men-jackets': 'outerwear',
  'men-jeans': 'bottoms',
  'men-trousers': 'bottoms',
  shoes: 'footwear',
  sneakers: 'footwear',
  sandals: 'footwear',
  watches: 'accessories',
  sunglasses: 'accessories',
  bags: 'accessories',
  belts: 'accessories',
};

const API_GROUP_BY_UI = {
  footwear: 'FOOTWEAR',
  accessories: 'ACCESSORIES',
};

function resolveUiCategoryFromLabel(value) {
  const label = String(value || '').toLowerCase();

  if (!label) {
    return null;
  }

  if (label.includes('t-shirt') || label.includes('tshirt') || label === 'shirts' || label.includes('shirt')) {
    return 'tops';
  }

  if (label.includes('jacket') || label.includes('outerwear') || label.includes('blazer')) {
    return 'outerwear';
  }

  if (label.includes('pant') || label.includes('jean') || label.includes('trouser') || label.includes('bottom')) {
    return 'bottoms';
  }

  if (label.includes('shoe') || label.includes('sneaker') || label.includes('footwear') || label.includes('sandal')) {
    return 'footwear';
  }

  if (label.includes('accessor') || label.includes('watch') || label.includes('bag') || label.includes('belt')) {
    return 'accessories';
  }

  return null;
}

export function resolveUiCategory(product) {
  const productType = product?.productType || product?.product_type;

  if (productType) {
    if (['T-Shirt', 'Shirt', 'Polo', 'Hoodie', 'Sweatshirt', 'Tank Top', 'Kurta'].includes(productType)) {
      return 'tops';
    }
    if (['Jacket', 'Blazer', 'Bomber Jacket'].includes(productType)) {
      return 'outerwear';
    }
    if (['Jeans', 'Chinos', 'Cargo Pants', 'Shorts', 'Joggers', 'Formal Pants'].includes(productType)) {
      return 'bottoms';
    }
    if (['Sneakers', 'Running Shoes', 'Loafers', 'Boots', 'Sandals', 'Slippers'].includes(productType)) {
      return 'footwear';
    }
    if (['Watch', 'Belt', 'Cap', 'Backpack', 'Sunglasses'].includes(productType)) {
      return 'accessories';
    }
  }

  if (product?.subcategory && SUBCATEGORY_UI_MAP[product.subcategory]) {
    return SUBCATEGORY_UI_MAP[product.subcategory];
  }

  const fromSubcategoryLabel = resolveUiCategoryFromLabel(product?.subcategory);
  if (fromSubcategoryLabel) {
    return fromSubcategoryLabel;
  }

  const fromCategoryLabel = resolveUiCategoryFromLabel(product?.category);
  if (fromCategoryLabel) {
    return fromCategoryLabel;
  }

  if (product?.avatarCategory === 'JACKET') return 'outerwear';
  if (product?.avatarCategory === 'BOTTOM') return 'bottoms';
  if (product?.avatarCategory === 'TOP') return 'tops';
  if (product?.avatarCategory === 'FOOTWEAR') return 'footwear';
  if (product?.avatarCategory === 'ACCESSORY') return 'accessories';

  if (product?.category === 'FOOTWEAR') return 'footwear';
  if (product?.category === 'ACCESSORIES') return 'accessories';

  return null;
}

export function matchesUiCategory(product, uiCategory) {
  if (!uiCategory || uiCategory === 'all') {
    return true;
  }

  return resolveUiCategory(product) === uiCategory;
}

export function getApiCategoryForUi(uiCategory) {
  return API_GROUP_BY_UI[uiCategory] ?? undefined;
}
