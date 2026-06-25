/**
 * Curated Wardrobe AI Collection shirts — auto-analyzed from uploaded product shots.
 * SKU prefix: TRYON-WAC-SHIRT-
 */

const { resolveTryOnProductId } = require('./try-on-products.seed.cjs');

const BRAND = 'Wardrobe AI Collection';
const CATEGORY = 'Shirts';
const SUBCATEGORY = 'shirts';
const GENDER = 'MALE';
const CURRENCY = 'INR';

function buildCuratedShirt(skuSuffix, meta, assetFileName) {
  const sku = `TRYON-WAC-SHIRT-${skuSuffix}`;

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

const CURATED_SHIRT_PRODUCTS = [
  buildCuratedShirt('05', {
    name: 'Premium Relaxed Fit Linen Shirt - Mocha Brown',
    description:
      'A refined long-sleeve linen shirt in rich mocha brown. Breathable weave, point collar, and tonal buttons make it ideal for elevated casual styling.',
    price: 1699,
    salePrice: 1299,
    rating: 4.6,
    stock: 55,
    color: 'Mocha Brown',
    pattern: 'Solid',
    fabric: 'Linen Blend',
    fitType: 'Relaxed Fit',
    garmentType: 'Casual Shirt',
    sleeveType: 'Long Sleeve',
    collarType: 'Point Collar',
    styleCategory: 'Smart Casual',
  }, 'wac-shirt-brown-linen.png'),

  buildCuratedShirt('06', {
    name: 'Premium Relaxed Fit Linen Shirt - Cornflower Blue',
    description:
      'Cornflower blue linen shirt with a clean front placket and buttoned cuffs. Lightweight, breathable, and perfect for warm-weather smart casual looks.',
    price: 1899,
    salePrice: 1499,
    rating: 4.7,
    stock: 65,
    color: 'Cornflower Blue',
    pattern: 'Solid',
    fabric: 'Linen Blend',
    fitType: 'Regular Fit',
    garmentType: 'Casual Shirt',
    sleeveType: 'Long Sleeve',
    collarType: 'Point Collar',
    styleCategory: 'Relaxed Casual',
  }, 'wac-shirt-blue-linen.png'),

  buildCuratedShirt('07', {
    name: 'Premium White Linen Long Sleeve Shirt',
    description:
      'A timeless white linen shirt with a classic point collar and breathable natural texture. A versatile wardrobe essential for day-to-night styling.',
    price: 1999,
    salePrice: 1499,
    rating: 4.7,
    stock: 75,
    color: 'White',
    pattern: 'Solid',
    fabric: 'Linen',
    fitType: 'Regular Fit',
    garmentType: 'Linen Shirt',
    sleeveType: 'Long Sleeve',
    collarType: 'Point Collar',
    styleCategory: 'Premium Casual',
  }, 'wac-shirt-white-linen.png'),

  buildCuratedShirt('08', {
    name: 'Classic Button-Down Linen Shirt',
    description:
      'Deep burgundy button-down shirt with chest pocket and contrast buttons. Tailored smart-casual silhouette in breathable linen-cotton blend.',
    price: 1799,
    salePrice: 1399,
    rating: 4.5,
    stock: 60,
    color: 'Burgundy',
    pattern: 'Solid',
    fabric: 'Linen Cotton Blend',
    fitType: 'Slim Fit',
    garmentType: 'Button-Down Shirt',
    sleeveType: 'Long Sleeve',
    collarType: 'Button-Down Collar',
    styleCategory: 'Business Casual',
  }, 'wac-shirt-burgundy-linen.png'),

  buildCuratedShirt('09', {
    name: 'Relaxed Fit Linen Shirt - Blush Pink',
    description:
      'Soft blush pink linen shirt with chest pocket and pearlescent buttons. Relaxed drape and premium texture for effortless summer styling.',
    price: 1699,
    salePrice: 1299,
    rating: 4.6,
    stock: 50,
    color: 'Blush Pink',
    pattern: 'Solid',
    fabric: 'Linen Blend',
    fitType: 'Relaxed Fit',
    garmentType: 'Casual Shirt',
    sleeveType: 'Long Sleeve',
    collarType: 'Point Collar',
    styleCategory: 'Summer Casual',
  }, 'wac-shirt-pink-linen.png'),
];

module.exports = {
  CURATED_SHIRT_PRODUCTS,
  CURATED_SHIRT_ASSETS_DIR: 'assets/curated-shirts',
  CURATED_SHIRT_UPLOAD_DIR: 'products/curated-shirts',
};
