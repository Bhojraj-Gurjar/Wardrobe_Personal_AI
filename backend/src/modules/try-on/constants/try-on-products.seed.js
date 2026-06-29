/**
 * Dedicated Try-On Studio catalog — flat-lay / front-facing garment images for CatVTON.
 * SKU prefix: TRYON-
 */

const { createHash } = require('node:crypto');
const LEGACY_USD_TO_INR = 83;

const TRYON_ID_NAMESPACE = 'wardrobe-ai:tryon-catalog:v1';
const TRYON_SKU_PREFIX = 'TRYON-';

function toUuidFromHash(hashHex) {
  const variant = ((parseInt(hashHex.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, '0');

  return [
    hashHex.slice(0, 8),
    hashHex.slice(8, 12),
    `4${hashHex.slice(13, 16)}`,
    `${variant}${hashHex.slice(18, 20)}`,
    hashHex.slice(20, 32),
  ].join('-');
}

function resolveTryOnProductId(sku) {
  const hash = createHash('sha256')
    .update(`${TRYON_ID_NAMESPACE}:${sku}`)
    .digest('hex');

  return toUuidFromHash(hash);
}

const GARMENT_IMAGES = {
  tshirts: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&h=1200&q=85',
    'https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
    'https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
    'https://images.pexels.com/photos/6311474/pexels-photo-6311474.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
  ],
  shirts: [
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&h=1200&q=85',
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&h=1200&q=85',
    'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
    'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
  ],
  jackets: [
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&h=1200&q=85',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&h=1200&q=85',
    'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
    'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
  ],
  pants: [
    'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1000&h=1200&q=85',
    'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
    'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
    'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
  ],
  footwear: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&h=1200&q=85',
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=1000&h=1200&q=85',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&h=1200&q=85',
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1000&h=1200&q=85',
  ],
};

function buildProduct(skuSuffix, meta, imageUrl) {
  const sku = `${TRYON_SKU_PREFIX}${skuSuffix}`;

  return {
    id: resolveTryOnProductId(sku),
    sku,
    name: meta.name,
    description: meta.description,
    category: meta.category,
    subcategory: meta.subcategory,
    gender: 'MALE',
    brand: meta.brand,
    price: Math.round(meta.price * LEGACY_USD_TO_INR),
    currency: 'INR',
    color: meta.color,
    imageUrl: imageUrl,
    tryOnImage: imageUrl,
    isTryOnCompatible: true,
    isActive: true,
  };
}

const TRY_ON_PRODUCT_SEED = [
  ...[
    ['HM-TEE-01', { name: 'H&M Cotton Crew Tee', brand: 'H&M', category: 'T-Shirts', subcategory: 't-shirts', price: 14.99, color: 'White', description: 'Classic crew-neck cotton tee for everyday wear.' }],
    ['ZARA-TEE-02', { name: 'Zara Relaxed Fit Tee', brand: 'Zara', category: 'T-Shirts', subcategory: 't-shirts', price: 19.99, color: 'Black', description: 'Relaxed fit jersey tee with soft hand feel.' }],
    ['UNIQLO-TEE-03', { name: 'Uniqlo Supima Cotton Tee', brand: 'Uniqlo', category: 'T-Shirts', subcategory: 't-shirts', price: 17.99, color: 'Navy', description: 'Premium Supima cotton everyday tee.' }],
    ['MANGO-TEE-04', { name: 'Mango Basic Organic Tee', brand: 'Mango', category: 'T-Shirts', subcategory: 't-shirts', price: 16.49, color: 'Grey', description: 'Organic cotton basic tee with clean silhouette.' }],
  ].map(([suffix, meta], index) => buildProduct(suffix, meta, GARMENT_IMAGES.tshirts[index])),

  ...[
    ['ALLEN-SHIRT-01', { name: 'Allen Solly Slim Formal Shirt', brand: 'Allen Solly', category: 'Shirts', subcategory: 'shirts', price: 34.99, color: 'Sky Blue', description: 'Slim-fit formal shirt for office and events.' }],
    ['VH-SHIRT-02', { name: 'Van Heusen Easy-Iron Shirt', brand: 'Van Heusen', category: 'Shirts', subcategory: 'shirts', price: 39.99, color: 'White', description: 'Wrinkle-resistant formal shirt with spread collar.' }],
    ['LP-SHIRT-03', { name: 'Louis Philippe Premium Shirt', brand: 'Louis Philippe', category: 'Shirts', subcategory: 'shirts', price: 44.99, color: 'Lavender', description: 'Premium cotton formal shirt with tailored fit.' }],
    ['HM-SHIRT-04', { name: 'H&M Slim Fit Oxford Shirt', brand: 'H&M', category: 'Shirts', subcategory: 'shirts', price: 24.99, color: 'Light Blue', description: 'Oxford weave shirt with button-down collar.' }],
  ].map(([suffix, meta], index) => buildProduct(suffix, meta, GARMENT_IMAGES.shirts[index])),

  ...[
    ['ZARA-JKT-01', { name: 'Zara Denim Trucker Jacket', brand: 'Zara', category: 'Jackets', subcategory: 'jackets', price: 59.99, color: 'Indigo', description: 'Classic denim trucker jacket with metal hardware.' }],
    ['LEVIS-JKT-02', { name: "Levi's Sherpa Lined Jacket", brand: "Levi's", category: 'Jackets', subcategory: 'jackets', price: 89.99, color: 'Brown', description: 'Warm sherpa-lined jacket for cooler days.' }],
    ['UNIQLO-JKT-03', { name: 'Uniqlo Blocktech Parka', brand: 'Uniqlo', category: 'Jackets', subcategory: 'jackets', price: 79.99, color: 'Olive', description: 'Lightweight water-resistant parka jacket.' }],
    ['MANGO-JKT-04', { name: 'Mango Faux Leather Biker Jacket', brand: 'Mango', category: 'Jackets', subcategory: 'jackets', price: 69.99, color: 'Black', description: 'Faux leather biker jacket with zip front.' }],
  ].map(([suffix, meta], index) => buildProduct(suffix, meta, GARMENT_IMAGES.jackets[index])),

  ...[
    ['LEVIS-PANT-01', { name: "Levi's 511 Slim Jeans", brand: "Levi's", category: 'Pants', subcategory: 'pants', price: 49.99, color: 'Dark Wash', description: 'Slim-fit stretch denim with classic 5-pocket styling.' }],
    ['HM-PANT-02', { name: 'H&M Regular Fit Chinos', brand: 'H&M', category: 'Pants', subcategory: 'pants', price: 34.99, color: 'Khaki', description: 'Regular-fit chinos in stretch cotton twill.' }],
    ['ZARA-PANT-03', { name: 'Zara Tailored Trousers', brand: 'Zara', category: 'Pants', subcategory: 'pants', price: 45.99, color: 'Charcoal', description: 'Tailored trousers with pressed crease.' }],
    ['UNIQLO-PANT-04', { name: 'Uniqlo Smart Ankle Pants', brand: 'Uniqlo', category: 'Pants', subcategory: 'pants', price: 39.99, color: 'Navy', description: 'Smart ankle-length pants with stretch comfort.' }],
  ].map(([suffix, meta], index) => buildProduct(suffix, meta, GARMENT_IMAGES.pants[index])),

  ...[
    ['HM-SHOE-01', { name: 'H&M Canvas Sneakers', brand: 'H&M', category: 'Footwear', subcategory: 'footwear', price: 29.99, color: 'White', description: 'Low-profile canvas sneakers with rubber sole.' }],
    ['ZARA-SHOE-02', { name: 'Zara Leather Derby Shoes', brand: 'Zara', category: 'Footwear', subcategory: 'footwear', price: 79.99, color: 'Brown', description: 'Classic leather derby shoes for smart casual looks.' }],
    ['UNIQLO-SHOE-03', { name: 'Uniqlo Sporty Running Shoes', brand: 'Uniqlo', category: 'Footwear', subcategory: 'footwear', price: 59.99, color: 'Grey', description: 'Lightweight running shoes with cushioned sole.' }],
    ['LEVIS-SHOE-04', { name: "Levi's Classic High-Top Sneakers", brand: "Levi's", category: 'Footwear', subcategory: 'footwear', price: 64.99, color: 'Red', description: 'High-top sneakers with contrast stitching.' }],
  ].map(([suffix, meta], index) => buildProduct(suffix, meta, GARMENT_IMAGES.footwear[index])),
];

module.exports = {
  TRYON_SKU_PREFIX,
  TRY_ON_PRODUCT_SEED,
  resolveTryOnProductId,
};
