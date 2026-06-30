/**
 * Curated Wardrobe AI Collection pants — auto-analyzed from uploaded product shots.
 * SKU prefix: TRYON-WAC-PANT-
 */

const { resolveTryOnProductId } = require('./try-on-products.seed.cjs');

const BRAND = 'Wardrobe AI Collection';
const CATEGORY = 'Pants';
const SUBCATEGORY = 'pants';
const GENDER = 'UNISEX';
const CURRENCY = 'INR';

function buildCuratedPant(skuSuffix, meta, assetFileName) {
  const sku = `TRYON-WAC-PANT-${skuSuffix}`;

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

const CURATED_PANT_PRODUCTS = [
  buildCuratedPant('01', {
    name: 'Essential Off-White Straight Leg Trousers',
    description:
      'Minimalist off-white trousers in a breathable cotton-blend twill. Relaxed straight-leg silhouette with belt loops, zip fly, and a clean flat-front finish for smart-casual summer styling.',
    price: 1999,
    salePrice: 1599,
    rating: 4.7,
    stock: 45,
    color: 'Off-White / Cream',
    pattern: 'Solid',
    fabric: 'Cotton Twill Blend',
    fitType: 'Relaxed Straight Fit',
    garmentType: 'Straight-Leg Trousers',
    styleCategory: 'Smart Casual / Minimalist',
  }, 'wac-pant-offwhite-straight.png'),

  buildCuratedPant('02', {
    name: 'Premium Black Relaxed Straight Trousers',
    description:
      'Solid black straight-leg trousers with a subtle textured weave. Belt-loop waistband, side-seam pockets, and a matte linen-cotton finish for versatile smart-casual outfits.',
    price: 1899,
    salePrice: 1499,
    rating: 4.6,
    stock: 55,
    color: 'Black',
    pattern: 'Solid',
    fabric: 'Linen Cotton Blend',
    fitType: 'Relaxed Straight Fit',
    garmentType: 'Straight-Leg Trousers',
    styleCategory: 'Smart Casual / Minimalist',
  }, 'wac-pant-black-straight.png'),

  buildCuratedPant('03', {
    name: 'Wide-Leg Espresso Trousers',
    description:
      'Dark brown wide-leg trousers in a soft woven cotton blend. Modern relaxed silhouette with belt loops, concealed zip fly, and functional side pockets.',
    price: 2199,
    salePrice: 1699,
    rating: 4.7,
    stock: 40,
    color: 'Espresso Brown',
    pattern: 'Solid',
    fabric: 'Cotton Linen Blend',
    fitType: 'Wide Leg',
    garmentType: 'Wide-Leg Trousers',
    styleCategory: 'Smart Casual / Relaxed',
  }, 'wac-pant-espresso-wide.png'),

  buildCuratedPant('04', {
    name: 'Relaxed Drawstring Linen Pants',
    description:
      'Earthy brown drawstring linen pants with an elastic waistband and straight-leg cut. Breathable natural texture and side pockets for effortless casual comfort.',
    price: 1799,
    salePrice: 1399,
    rating: 4.5,
    stock: 50,
    color: 'Dark Earth Brown',
    pattern: 'Solid',
    fabric: 'Linen Blend',
    fitType: 'Relaxed Fit',
    garmentType: 'Drawstring Linen Pants',
    styleCategory: 'Casual / Summer',
  }, 'wac-pant-brown-drawstring.png'),

  buildCuratedPant('05', {
    name: 'Premium Beige Linen Pressed Trousers',
    description:
      'Light beige linen trousers with a pressed center crease and straight tapered leg. Belt-loop waistband and clean hem for refined resort and summer smart-casual looks.',
    price: 2099,
    salePrice: 1649,
    rating: 4.8,
    stock: 42,
    color: 'Light Beige / Oatmeal',
    pattern: 'Solid',
    fabric: 'Linen',
    fitType: 'Straight Tapered Fit',
    garmentType: 'Linen Trousers',
    styleCategory: 'Resort / Smart Casual',
  }, 'wac-pant-beige-linen.png'),
];

module.exports = {
  CURATED_PANT_PRODUCTS,
  CURATED_PANT_ASSETS_DIR: 'assets/curated-pants',
  CURATED_PANT_UPLOAD_DIR: 'products/curated-pants',
};
