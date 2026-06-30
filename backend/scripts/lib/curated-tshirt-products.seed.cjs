/**
 * Curated Wardrobe AI Collection t-shirts — auto-analyzed from uploaded product shots.
 * SKU prefix: TRYON-WAC-TEE-
 */

const { resolveTryOnProductId } = require('./try-on-products.seed.cjs');

const BRAND = 'Wardrobe AI Collection';
const CATEGORY = 'T-Shirts';
const SUBCATEGORY = 't-shirts';
const GENDER = 'UNISEX';
const CURRENCY = 'INR';

function buildCuratedTshirt(skuSuffix, meta, assetFileName) {
  const sku = `TRYON-WAC-TEE-${skuSuffix}`;

  return {
    id: resolveTryOnProductId(sku),
    sku,
    assetFileName,
    name: meta.name,
    description: meta.description,
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    gender: GENDER,
    brand: BRAND,
    price: meta.price,
    salePrice: meta.salePrice,
    currency: CURRENCY,
    color: meta.color,
    pattern: meta.pattern,
    fabric: meta.fabric,
    fitType: meta.fitType,
    rating: meta.rating,
    stock: meta.stock,
    styleTags: {
      garmentType: meta.garmentType,
      sleeveType: meta.sleeveType,
      collarType: meta.collarType,
      fabricType: meta.fabric,
      styleCategory: meta.styleCategory,
      pattern: meta.pattern,
      originalPrice: meta.price,
      salePrice: meta.salePrice,
      rating: meta.rating,
      stock: meta.stock,
      curated: true,
      source: 'image-analysis',
    },
    isTryOnCompatible: true,
    isActive: true,
  };
}

const CURATED_TSHIRT_PRODUCTS = [
  buildCuratedTshirt('01', {
    name: 'Premium Navy Ringer T-Shirt',
    description:
      'Classic navy ringer tee with contrasting white ribbed collar and sleeve cuffs. Soft cotton jersey with a retro-sport silhouette for everyday casual wear.',
    price: 1299,
    salePrice: 999,
    rating: 4.6,
    stock: 80,
    color: 'Navy Blue / White Trim',
    pattern: 'Solid with Contrast Trim',
    fabric: 'Cotton Jersey',
    fitType: 'Regular Fit',
    garmentType: 'Ringer T-Shirt',
    sleeveType: 'Short Sleeve',
    collarType: 'Crew Neck Ringer',
    styleCategory: 'Casual / Retro Sport',
  }, 'wac-tee-navy-ringer.png'),

  buildCuratedTshirt('02', {
    name: 'Classic Cream Ringer T-Shirt - Black Trim',
    description:
      'Off-white ringer tee finished with bold black ribbing at the neck and sleeves. A minimalist sporty essential with a soft cotton hand feel.',
    price: 1199,
    salePrice: 899,
    rating: 4.5,
    stock: 70,
    color: 'Cream / Black Trim',
    pattern: 'Solid with Contrast Trim',
    fabric: 'Cotton Jersey Blend',
    fitType: 'Regular Fit',
    garmentType: 'Ringer T-Shirt',
    sleeveType: 'Short Sleeve',
    collarType: 'Crew Neck Ringer',
    styleCategory: 'Casual / Retro',
  }, 'wac-tee-cream-ringer.png'),

  buildCuratedTshirt('03', {
    name: 'Retro USA 94 Polo T-Shirt',
    description:
      'Vintage-inspired polo tee in cream with navy contrast collar and striped cuffs. Features bold USA 94 chest typography for a retro football aesthetic.',
    price: 1599,
    salePrice: 1199,
    rating: 4.7,
    stock: 55,
    color: 'Cream / Navy Accent',
    pattern: 'Graphic Print',
    fabric: 'Piqué Cotton',
    fitType: 'Regular Fit',
    garmentType: 'Polo T-Shirt',
    sleeveType: 'Short Sleeve',
    collarType: 'V-Neck Spread Collar',
    styleCategory: 'Retro Sporty',
  }, 'wac-tee-usa94-polo.png'),

  buildCuratedTshirt('04', {
    name: 'Field Club West Coast Graphic T-Shirt',
    description:
      'Oversized cream graphic tee with Field Club serif branding and west coast script detail. Relaxed streetwear silhouette in premium cotton jersey.',
    price: 1499,
    salePrice: 1099,
    rating: 4.6,
    stock: 65,
    color: 'Off-White / Cream',
    pattern: 'Graphic Print',
    fabric: 'Cotton Jersey',
    fitType: 'Oversized Fit',
    garmentType: 'Graphic T-Shirt',
    sleeveType: 'Short Sleeve',
    collarType: 'Crew Neck',
    styleCategory: 'Streetwear / Casual',
  }, 'wac-tee-field-club.png'),

  buildCuratedTshirt('05', {
    name: 'Premium Essential Burgundy Crew Neck T-Shirt',
    description:
      'A timeless burgundy crew neck tee crafted from soft breathable cotton. Clean minimalist design with a comfortable relaxed fit for daily styling.',
    price: 1299,
    salePrice: 899,
    rating: 4.8,
    stock: 75,
    color: 'Burgundy',
    pattern: 'Solid',
    fabric: 'Premium Cotton Jersey',
    fitType: 'Relaxed Fit',
    garmentType: 'Crew Neck T-Shirt',
    sleeveType: 'Short Sleeve',
    collarType: 'Ribbed Crew Neck',
    styleCategory: 'Casual Essential',
  }, 'wac-tee-burgundy-essential.png'),
];

module.exports = {
  CURATED_TSHIRT_PRODUCTS,
  CURATED_TSHIRT_ASSETS_DIR: 'assets/curated-tshirts',
  CURATED_TSHIRT_UPLOAD_DIR: 'products/curated-tshirts',
};
