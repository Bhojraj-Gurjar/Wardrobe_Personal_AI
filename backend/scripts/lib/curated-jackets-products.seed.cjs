/**
 * Curated Wardrobe AI Collection jackets — auto-analyzed from uploaded product shots.
 * SKU prefix: TRYON-WAC-JKT-
 */

const { resolveTryOnProductId } = require('./try-on-products.seed.cjs');

const BRAND = 'Wardrobe AI Collection';
const CATEGORY = 'Jackets';
const SUBCATEGORY = 'jackets';
const CURRENCY = 'INR';

function buildCuratedJacket(skuSuffix, meta, assetFileName) {
  const sku = `TRYON-WAC-JKT-${skuSuffix}`;

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

const CURATED_JACKET_PRODUCTS = [
  buildCuratedJacket('01', {
    name: 'Retro Color-Block Track Jacket',
    description:
      'Bold black and red color-block track jacket with white piping, ribbed trims, and a distinctive ring-pull zipper. Premium jersey blend with zip pockets for retro sportswear style.',
    price: 1999,
    salePrice: 1599,
    rating: 4.8,
    stock: 65,
    gender: 'UNISEX',
    color: 'Black / Red / White',
    pattern: 'Color-Block',
    fabric: 'Polyester Cotton Jersey',
    fitType: 'Regular Fit',
    garmentType: 'Track Jacket',
    sleeveType: 'Long Sleeve',
    collarType: 'Stand Collar',
    styleCategory: 'Sportswear / Retro Streetwear',
  }, 'wac-jkt-track-colorblock.png'),

  buildCuratedJacket('02', {
    name: 'Lightweight Technical Windbreaker',
    description:
      'Olive green hooded windbreaker in water-resistant synthetic fabric. Full zip front, integrated hood, and elastic cuffs for lightweight outdoor and techwear layering.',
    price: 1899,
    salePrice: 1499,
    rating: 4.6,
    stock: 75,
    gender: 'UNISEX',
    color: 'Olive Green',
    pattern: 'Solid',
    fabric: 'Nylon Polyester Blend',
    fitType: 'Regular Fit',
    garmentType: 'Windbreaker',
    sleeveType: 'Long Sleeve',
    collarType: 'Hooded High Neck',
    styleCategory: 'Outdoor / Techwear',
  }, 'wac-jkt-olive-windbreaker.png'),

  buildCuratedJacket('03', {
    name: 'Minimalist Sand Harrington Jacket',
    description:
      'Versatile sand-tone Harrington jacket with full zip, stand collar, and oversized utility patch pockets. Elasticated hem and button-tab detail for smart-casual everyday wear.',
    price: 2499,
    salePrice: 1999,
    rating: 4.7,
    stock: 35,
    gender: 'UNISEX',
    color: 'Sand / Beige',
    pattern: 'Solid',
    fabric: 'Cotton Twill Blend',
    fitType: 'Regular Fit',
    garmentType: 'Harrington Jacket',
    sleeveType: 'Long Sleeve',
    collarType: 'Stand Collar',
    styleCategory: 'Smart Casual / Minimalist',
  }, 'wac-jkt-sand-harrington.png'),

  buildCuratedJacket('04', {
    name: 'Urban Tech Hooded Utility Jacket',
    description:
      'Matte black cropped utility jacket with oversized flap pockets, concealed front fastening, and adjustable drawstring hem. High-neck hood and elastic cuffs for modern streetwear styling.',
    price: 2499,
    salePrice: 1999,
    rating: 4.7,
    stock: 75,
    gender: 'FEMALE',
    color: 'Black',
    pattern: 'Solid',
    fabric: 'Water-Resistant Polyester',
    fitType: 'Cropped Boxy Fit',
    garmentType: 'Utility Jacket',
    sleeveType: 'Long Sleeve',
    collarType: 'Hooded High Neck',
    styleCategory: 'Techwear / Streetwear',
  }, 'wac-jkt-black-utility.png'),

  buildCuratedJacket('05', {
    name: 'Minimalist Faux Leather Zip-Up Jacket',
    description:
      'Sleek black faux leather jacket with full front zipper, classic point collar, and horizontal sleeve seam detailing. Soft grain texture with comfortable lining for transitional weather.',
    price: 2999,
    salePrice: 2499,
    rating: 4.8,
    stock: 40,
    gender: 'UNISEX',
    color: 'Black',
    pattern: 'Solid',
    fabric: 'Faux Leather',
    fitType: 'Slim Fit',
    garmentType: 'Leather Jacket',
    sleeveType: 'Long Sleeve',
    collarType: 'Point Collar',
    styleCategory: 'Casual / Modern Streetwear',
  }, 'wac-jkt-black-faux-leather.png'),
];

module.exports = {
  CURATED_JACKET_PRODUCTS,
  CURATED_JACKET_ASSETS_DIR: 'assets/curated-jackets',
  CURATED_JACKET_UPLOAD_DIR: 'products/curated-jackets',
};
