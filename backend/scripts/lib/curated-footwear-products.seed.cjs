/**
 * Curated Wardrobe AI Collection footwear — auto-analyzed from uploaded product shots.
 * SKU prefix: TRYON-WAC-SHOE-
 */

const { resolveTryOnProductId } = require('./try-on-products.seed.cjs');

const BRAND = 'Wardrobe AI Collection';
const CATEGORY = 'Footwear';
const SUBCATEGORY = 'footwear';
const CURRENCY = 'INR';

function buildCuratedFootwear(skuSuffix, meta, assetFileName) {
  const sku = `TRYON-WAC-SHOE-${skuSuffix}`;

  return {
    id: resolveTryOnProductId(sku),
    sku,
    assetFileName,
    name: meta.name,
    description: meta.description,
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    gender: meta.gender,
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
      sleeveType: 'N/A',
      collarType: 'N/A',
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

const CURATED_FOOTWEAR_PRODUCTS = [
  buildCuratedFootwear('01', {
    name: 'Retro Color-Block Low-Top Sneakers',
    description:
      'Two-tone beige and cream low-top sneakers with suede overlays, perforated toe box, and a durable rubber cupsole. Classic skate-inspired silhouette for everyday streetwear.',
    price: 2499,
    salePrice: 1999,
    rating: 4.7,
    stock: 60,
    gender: 'UNISEX',
    color: 'Beige / Cream',
    pattern: 'Color-Block',
    fabric: 'Suede and Synthetic Leather',
    fitType: 'Regular Fit',
    garmentType: 'Low-Top Sneakers',
    styleCategory: 'Casual / Streetwear',
  }, 'wac-shoe-beige-sneakers.png'),

  buildCuratedFootwear('02', {
    name: 'Premium Suede Derby Shoes - Dark Brown',
    description:
      'Sophisticated dark olive-brown suede Derby shoes with open lacing, welted sole construction, and a rounded toe. Ideal for smart-casual and business-casual styling.',
    price: 3499,
    salePrice: 2799,
    rating: 4.8,
    stock: 45,
    gender: 'MALE',
    color: 'Dark Olive Brown',
    pattern: 'Solid',
    fabric: 'Premium Suede Leather',
    fitType: 'Standard Fit',
    garmentType: 'Derby Shoes',
    styleCategory: 'Smart Casual / Formal',
  }, 'wac-shoe-brown-derby.png'),

  buildCuratedFootwear('03', {
    name: 'Urban Mesh Platform Sneakers',
    description:
      'Off-white chunky platform sneakers with breathable mesh upper, synthetic overlays, and a thick tonal sole. Wide flat laces and heel pull tab for modern athleisure style.',
    price: 2999,
    salePrice: 2249,
    rating: 4.8,
    stock: 75,
    gender: 'UNISEX',
    color: 'Off-White / Cream',
    pattern: 'Solid Multi-Panel',
    fabric: 'Mesh and Synthetic',
    fitType: 'Regular Fit',
    garmentType: 'Platform Sneakers',
    styleCategory: 'Streetwear / Athleisure',
  }, 'wac-shoe-white-platform.png'),

  buildCuratedFootwear('04', {
    name: 'Minimalist Black Criss-Cross Strap Slides',
    description:
      'Contemporary black slide sandals with wide criss-cross straps, smooth matte finish, and a thick ergonomically molded footbed for elevated casual comfort.',
    price: 2499,
    salePrice: 1899,
    rating: 4.8,
    stock: 120,
    gender: 'UNISEX',
    color: 'Black',
    pattern: 'Solid',
    fabric: 'Matte Leather / Faux Leather',
    fitType: 'Standard Fit',
    garmentType: 'Slide Sandals',
    styleCategory: 'Casual / Minimalist',
  }, 'wac-shoe-black-slides.png'),

  buildCuratedFootwear('05', {
    name: 'Tactical Olive Green Buckle Sandals',
    description:
      'Rugged dual-strap sandals in olive green with nylon webbing, side-release buckles, contoured tan footbed, and a thick lugged outsole for outdoor traction.',
    price: 2499,
    salePrice: 1899,
    rating: 4.7,
    stock: 85,
    gender: 'UNISEX',
    color: 'Olive Green / Tan',
    pattern: 'Solid / Utilitarian',
    fabric: 'Microfiber and Nylon Webbing',
    fitType: 'Adjustable Fit',
    garmentType: 'Buckle Sandals',
    styleCategory: 'Tactical Casual / Outdoor',
  }, 'wac-shoe-olive-sandals.png'),
];

module.exports = {
  CURATED_FOOTWEAR_PRODUCTS,
  CURATED_FOOTWEAR_ASSETS_DIR: 'assets/curated-footwear',
  CURATED_FOOTWEAR_UPLOAD_DIR: 'products/curated-footwear',
};
