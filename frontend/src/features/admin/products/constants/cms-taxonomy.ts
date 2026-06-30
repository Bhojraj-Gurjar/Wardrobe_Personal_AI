export const CMS_CATEGORIES = [
  'Clothing',
  'Footwear',
  'Accessories',
  'Bags',
  'Watches',
  'Eyewear',
  'Jewellery',
] as const;

export const LEGACY_CATEGORY_TO_CMS: Record<string, string> = {
  Tops: 'Clothing',
  Bottoms: 'Clothing',
  Outerwear: 'Clothing',
  Jackets: 'Clothing',
  Clothing: 'Clothing',
  Footwear: 'Footwear',
  Accessories: 'Accessories',
};

export const CMS_PRODUCT_TYPES_BY_CATEGORY: Record<string, string[]> = {
  Clothing: [
    'T-Shirt', 'Shirt', 'Overshirt', 'Polo', 'Hoodie', 'Sweatshirt', 'Sweater',
    'Jacket', 'Blazer', 'Coat', 'Suit', 'Kurta', 'Sherwani', 'Jeans', 'Pants', 'Cargo', 'Trouser',
    'Trousers', 'Jogger', 'Joggers', 'Shorts', 'Track Pant', 'Tracksuit', 'Co-ord Set', 'Innerwear',
    'Tank Top', 'Chinos', 'Formal Pants', 'Bomber Jacket', 'Vest',
  ],
  Footwear: [
    'Sneakers', 'Running Shoes', 'Casual Shoes', 'Loafers', 'Formal Shoes', 'Boots',
    'Slides', 'Sandals', 'Flip Flops', 'Slippers',
  ],
  Accessories: [
    'Cap', 'Belt', 'Wallet', 'Scarf', 'Gloves', 'Socks', 'Tie', 'Cufflinks',
    'Sunglasses', 'Watch', 'Backpack', 'Handbag', 'Bracelet', 'Necklace',
  ],
  Bags: ['Backpack', 'Tote Bag', 'Crossbody Bag', 'Clutch', 'Duffel Bag', 'Laptop Bag', 'Sling Bag'],
  Watches: ['Analog Watch', 'Digital Watch', 'Smartwatch', 'Chronograph', 'Dress Watch'],
  Eyewear: ['Sunglasses', 'Eyeglasses', 'Aviator', 'Wayfarer', 'Sports Eyewear'],
  Jewellery: ['Necklace', 'Bracelet', 'Ring', 'Earrings', 'Chain', 'Pendant', 'Bangle'],
};

export const CMS_FASHION_COLORS = [
  'Black', 'White', 'Grey', 'Navy', 'Blue', 'Light Blue', 'Olive', 'Green', 'Beige',
  'Brown', 'Khaki', 'Cream', 'Maroon', 'Red', 'Pink', 'Purple', 'Yellow', 'Orange',
  'Gold', 'Silver', 'Multi',
];

export const CMS_APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
export const CMS_JEANS_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42'];
export const CMS_SHOE_SIZES = ['6', '7', '8', '9', '10', '11', '12', '13'];
export const CMS_ONE_SIZE = ['One Size'];

export const CMS_SIZES_BY_PRODUCT_TYPE: Record<string, string[]> = {
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
  Sunglasses: CMS_ONE_SIZE,
  Eyeglasses: CMS_ONE_SIZE,
  Necklace: CMS_ONE_SIZE,
  Bracelet: CMS_ONE_SIZE,
  Ring: CMS_ONE_SIZE,
  Backpack: CMS_ONE_SIZE,
  Handbag: CMS_ONE_SIZE,
  Innerwear: CMS_APPAREL_SIZES,
};

export const CMS_GENDERS = ['Men', 'Women', 'Unisex', 'Kids'];
export const CMS_VISIBILITY = ['DRAFT', 'PUBLISHED', 'HIDDEN', 'OUT_OF_STOCK'];
export const CMS_AI_STYLES = ['Smart Casual', 'Formal', 'Streetwear', 'Minimal', 'Luxury', 'Vintage'];
export const CMS_BODY_FITS = ['Slim', 'Regular', 'Oversized', 'Loose'];
export const CMS_BODY_TYPES = ['Athletic', 'Lean', 'Muscular', 'Petite', 'Plus Size'];
export const CMS_FACE_SHAPES = ['Oval', 'Round', 'Square', 'Diamond', 'Heart'];

export function resolveCmsCategory(category: string) {
  if (!category) {
    return '';
  }

  if (CMS_CATEGORIES.includes(category as typeof CMS_CATEGORIES[number])) {
    return category;
  }

  return LEGACY_CATEGORY_TO_CMS[category] || category;
}

export function getProductTypesForCategory(category: string) {
  const resolved = resolveCmsCategory(category);
  return CMS_PRODUCT_TYPES_BY_CATEGORY[resolved] || [];
}

export function getSizesForProductType(productType: string) {
  return CMS_SIZES_BY_PRODUCT_TYPE[productType] || CMS_APPAREL_SIZES;
}

export function formatAdminProductTypeLabel(value?: string | null) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || '—';
}
