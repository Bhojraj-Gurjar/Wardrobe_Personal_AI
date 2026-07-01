/**
 * Fashion e-commerce CMS taxonomy — categories, product types, sizes, colors.
 * Used by admin product management and bulk import validation.
 */

export const CMS_CATEGORIES = [
  'Clothing',
  'Footwear',
  'Accessories',
  'Bags',
  'Watches',
  'Eyewear',
  'Jewellery',
];

export const CMS_PRODUCT_TYPES_BY_CATEGORY = {
  Clothing: [
    'T-Shirt',
    'Shirt',
    'Overshirt',
    'Polo',
    'Hoodie',
    'Sweatshirt',
    'Sweater',
    'Jacket',
    'Blazer',
    'Coat',
    'Suit',
    'Kurta',
    'Sherwani',
    'Jeans',
    'Pants',
    'Cargo',
    'Trouser',
    'Trousers',
    'Jogger',
    'Joggers',
    'Shorts',
    'Track Pant',
    'Tracksuit',
    'Co-ord Set',
    'Innerwear',
    'Tank Top',
    'Chinos',
    'Formal Pants',
    'Bomber Jacket',
    'Vest',
  ],
  Footwear: [
    'Sneakers',
    'Running Shoes',
    'Casual Shoes',
    'Loafers',
    'Formal Shoes',
    'Boots',
    'Slides',
    'Sandals',
    'Flip Flops',
    'Slippers',
  ],
  Accessories: [
    'Cap',
    'Belt',
    'Wallet',
    'Scarf',
    'Gloves',
    'Socks',
    'Tie',
    'Cufflinks',
    'Sunglasses',
    'Watch',
    'Backpack',
    'Handbag',
    'Bracelet',
    'Necklace',
  ],
  Bags: [
    'Backpack',
    'Tote Bag',
    'Crossbody Bag',
    'Clutch',
    'Duffel Bag',
    'Laptop Bag',
    'Sling Bag',
  ],
  Watches: [
    'Analog Watch',
    'Digital Watch',
    'Smartwatch',
    'Chronograph',
    'Dress Watch',
  ],
  Eyewear: [
    'Sunglasses',
    'Eyeglasses',
    'Aviator',
    'Wayfarer',
    'Sports Eyewear',
  ],
  Jewellery: [
    'Necklace',
    'Bracelet',
    'Ring',
    'Earrings',
    'Chain',
    'Pendant',
    'Bangle',
  ],
};

export const CMS_FASHION_COLORS = [
  'Black',
  'White',
  'Grey',
  'Navy',
  'Blue',
  'Light Blue',
  'Olive',
  'Green',
  'Beige',
  'Brown',
  'Khaki',
  'Cream',
  'Maroon',
  'Red',
  'Pink',
  'Purple',
  'Yellow',
  'Orange',
  'Gold',
  'Silver',
  'Multi',
];

export const CMS_APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export const CMS_JEANS_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42'];

export const CMS_SHOE_SIZES = ['6', '7', '8', '9', '10', '11', '12', '13'];

export const CMS_ONE_SIZE = ['One Size'];

export const CMS_SIZES_BY_PRODUCT_TYPE = {
  Jeans: CMS_JEANS_SIZES,
  Pants: CMS_JEANS_SIZES,
  Cargo: CMS_JEANS_SIZES,
  Trouser: CMS_JEANS_SIZES,
  Trousers: CMS_JEANS_SIZES,
  'Formal Pants': CMS_JEANS_SIZES,
  Chinos: CMS_JEANS_SIZES,
  Jogger: CMS_JEANS_SIZES,
  Joggers: CMS_JEANS_SIZES,
  'Track Pant': CMS_JEANS_SIZES,
  Sneakers: CMS_SHOE_SIZES,
  'Running Shoes': CMS_SHOE_SIZES,
  'Casual Shoes': CMS_SHOE_SIZES,
  Loafers: CMS_SHOE_SIZES,
  'Formal Shoes': CMS_SHOE_SIZES,
  Boots: CMS_SHOE_SIZES,
  Slides: CMS_SHOE_SIZES,
  Sandals: CMS_SHOE_SIZES,
  'Flip Flops': CMS_SHOE_SIZES,
  Slippers: CMS_SHOE_SIZES,
  Cap: CMS_ONE_SIZE,
  Belt: CMS_ONE_SIZE,
  Wallet: CMS_ONE_SIZE,
  Watch: CMS_ONE_SIZE,
  'Analog Watch': CMS_ONE_SIZE,
  'Digital Watch': CMS_ONE_SIZE,
  Smartwatch: CMS_ONE_SIZE,
  Chronograph: CMS_ONE_SIZE,
  'Dress Watch': CMS_ONE_SIZE,
  Sunglasses: CMS_ONE_SIZE,
  Eyeglasses: CMS_ONE_SIZE,
  Aviator: CMS_ONE_SIZE,
  Wayfarer: CMS_ONE_SIZE,
  'Sports Eyewear': CMS_ONE_SIZE,
  Necklace: CMS_ONE_SIZE,
  Bracelet: CMS_ONE_SIZE,
  Ring: CMS_ONE_SIZE,
  Earrings: CMS_ONE_SIZE,
  Chain: CMS_ONE_SIZE,
  Pendant: CMS_ONE_SIZE,
  Bangle: CMS_ONE_SIZE,
  Backpack: CMS_ONE_SIZE,
  Handbag: CMS_ONE_SIZE,
  'Tote Bag': CMS_ONE_SIZE,
  'Crossbody Bag': CMS_ONE_SIZE,
  Clutch: CMS_ONE_SIZE,
  'Duffel Bag': CMS_ONE_SIZE,
  'Laptop Bag': CMS_ONE_SIZE,
  'Sling Bag': CMS_ONE_SIZE,
  Innerwear: CMS_APPAREL_SIZES,
};

export const CMS_GENDERS = ['Men', 'Women', 'Unisex', 'Kids'];

export const CMS_VISIBILITY_OPTIONS = [
  'DRAFT',
  'PUBLISHED',
  'HIDDEN',
  'OUT_OF_STOCK',
];

export const CMS_AI_STYLES = [
  'Smart Casual',
  'Formal',
  'Streetwear',
  'Minimal',
  'Luxury',
  'Vintage',
];

export const CMS_BODY_FITS = [
  'Slim',
  'Regular',
  'Oversized',
  'Loose',
];

export const CMS_BODY_TYPES = [
  'Athletic',
  'Lean',
  'Muscular',
  'Petite',
  'Plus Size',
];

export const CMS_FACE_SHAPES = [
  'Oval',
  'Round',
  'Square',
  'Diamond',
  'Heart',
];

export const CMS_BULK_REQUIRED_COLUMNS = [
  'sku',
  'name',
  'brand',
  'category',
  'productType',
  'gender',
  'mrp',
  'sellingPrice',
  'stockQuantity',
  'imageUrl',
  'variantColor',
];

export const BULK_TEMPLATE_CATEGORY_TO_CMS = {
  Shirts: 'Clothing',
  'T-Shirts': 'Clothing',
  Jeans: 'Clothing',
  Trousers: 'Clothing',
  Jackets: 'Clothing',
  Hoodies: 'Clothing',
  Sweatshirts: 'Clothing',
  Shoes: 'Footwear',
  Sneakers: 'Footwear',
  Sandals: 'Footwear',
  Accessories: 'Accessories',
  'Ethnic Wear': 'Clothing',
  'Formal Wear': 'Clothing',
  'Casual Wear': 'Clothing',
  Sportswear: 'Clothing',
  Others: 'Clothing',
};

export const BULK_GENDER_TO_CMS = {
  Male: 'Men',
  Female: 'Women',
  Men: 'Men',
  Women: 'Women',
  Unisex: 'Unisex',
  Kids: 'Kids',
};

export const BULK_VISIBILITY_TO_CMS = {
  Published: 'PUBLISHED',
  Draft: 'DRAFT',
  Hidden: 'HIDDEN',
  PUBLISHED: 'PUBLISHED',
  DRAFT: 'DRAFT',
  HIDDEN: 'HIDDEN',
};

export const BULK_SAMPLE_ROW_MARKER_SKU = 'SAMPLE-REMOVE-BEFORE-UPLOAD';

/** Legacy UI categories mapped to CMS categories for backward compatibility. */
export const LEGACY_CATEGORY_TO_CMS = {
  Tops: 'Clothing',
  Bottoms: 'Clothing',
  Outerwear: 'Clothing',
  Jackets: 'Clothing',
  Clothing: 'Clothing',
  Footwear: 'Footwear',
  Accessories: 'Accessories',
};

export const ALL_CMS_PRODUCT_TYPES = Object.values(CMS_PRODUCT_TYPES_BY_CATEGORY).flat();

export function isValidCmsCategory(category) {
  return CMS_CATEGORIES.includes(category)
    || Object.keys(LEGACY_CATEGORY_TO_CMS).includes(category);
}

export function isValidCmsProductType(productType, category) {
  if (!productType) {
    return false;
  }

  if (category && CMS_PRODUCT_TYPES_BY_CATEGORY[category]) {
    return CMS_PRODUCT_TYPES_BY_CATEGORY[category].includes(productType);
  }

  return ALL_CMS_PRODUCT_TYPES.includes(productType);
}

export function getCmsProductTypesForCategory(category) {
  if (CMS_PRODUCT_TYPES_BY_CATEGORY[category]) {
    return CMS_PRODUCT_TYPES_BY_CATEGORY[category];
  }

  const mapped = LEGACY_CATEGORY_TO_CMS[category];
  if (mapped) {
    return CMS_PRODUCT_TYPES_BY_CATEGORY[mapped] || [];
  }

  return [];
}

export function getCmsSizesForProductType(productType) {
  return CMS_SIZES_BY_PRODUCT_TYPE[productType] || CMS_APPAREL_SIZES;
}

export function isValidCmsColor(color) {
  return CMS_FASHION_COLORS.some(
    (item) => item.toLowerCase() === String(color || '').toLowerCase(),
  );
}

export function isValidCmsSize(size, productType) {
  const sizes = getCmsSizesForProductType(productType);
  return sizes.includes(size);
}

export function normalizeCmsCategory(category) {
  if (!category) {
    return null;
  }

  if (CMS_CATEGORIES.includes(category)) {
    return category;
  }

  if (BULK_TEMPLATE_CATEGORY_TO_CMS[category]) {
    return BULK_TEMPLATE_CATEGORY_TO_CMS[category];
  }

  return LEGACY_CATEGORY_TO_CMS[category] || category;
}

export function normalizeBulkGender(gender) {
  if (!gender) {
    return null;
  }

  return BULK_GENDER_TO_CMS[gender] || gender;
}

export function normalizeBulkVisibility(visibility) {
  if (!visibility) {
    return 'DRAFT';
  }

  return BULK_VISIBILITY_TO_CMS[visibility] || String(visibility).trim().toUpperCase();
}
