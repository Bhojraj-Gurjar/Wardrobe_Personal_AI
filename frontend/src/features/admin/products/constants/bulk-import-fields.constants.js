import {
  CMS_AI_STYLES,
  CMS_BODY_FITS,
  CMS_BODY_TYPES,
  CMS_FACE_SHAPES,
  CMS_FASHION_COLORS,
  CMS_PRODUCT_TYPES_BY_CATEGORY,
  CMS_APPAREL_SIZES,
  CMS_JEANS_SIZES,
  CMS_SHOE_SIZES,
  CMS_ONE_SIZE,
} from './cms-taxonomy';

/**
 * Single source of truth for bulk import columns — keep in sync with Add Single Product form.
 * Order matches the downloadable template exactly.
 */
export const BULK_IMPORT_COLUMNS = [
  { key: 'sku', header: 'SKU', required: true, tooltip: 'Unique stock-keeping unit. Must not already exist in the catalog.' },
  { key: 'name', header: 'Product Name', required: true, tooltip: 'Minimum 2 characters. Same rule as single-product form.' },
  { key: 'brand', header: 'Brand', required: true, tooltip: 'Brand or label name.' },
  { key: 'category', header: 'Category', required: true, dropdown: 'category', tooltip: 'Select from the Category dropdown list.' },
  { key: 'productType', header: 'Product Type', required: true, dropdown: 'productType', tooltip: 'Must be valid for the selected category (same as Add Single Product).' },
  { key: 'gender', header: 'Gender', required: true, dropdown: 'gender', tooltip: 'Male, Female, Unisex, or Kids.' },
  { key: 'description', header: 'Description', required: false, tooltip: 'Optional product description.' },
  { key: 'mrp', header: 'MRP', required: true, tooltip: 'Numeric. Must be greater than 0.' },
  { key: 'sellingPrice', header: 'Selling Price', required: true, tooltip: 'Numeric. Must be less than or equal to MRP.' },
  { key: 'stockQuantity', header: 'Stock Quantity', required: true, tooltip: 'Positive whole number.' },
  { key: 'imageUrl1', header: 'Image 1 URL', required: true, tooltip: 'Required. Must be a valid http(s) image URL.' },
  { key: 'imageUrl2', header: 'Image 2 URL', required: false, tooltip: 'Optional additional image URL.' },
  { key: 'imageUrl3', header: 'Image 3 URL', required: false, tooltip: 'Optional additional image URL.' },
  { key: 'imageUrl4', header: 'Image 4 URL', required: false, tooltip: 'Optional additional image URL.' },
  { key: 'color', header: 'Color', required: true, dropdown: 'color', tooltip: 'Must match the color list used in Add Single Product.' },
  { key: 'sizes', header: 'Sizes', required: true, dropdown: 'sizes', tooltip: 'One size or comma-separated sizes (e.g. S,M,L). Must be valid for the product type.' },
  { key: 'fabric', header: 'Fabric', required: false },
  { key: 'pattern', header: 'Pattern', required: false },
  { key: 'sleeveType', header: 'Sleeve Type', required: false },
  { key: 'neckType', header: 'Neck Type', required: false },
  { key: 'occasion', header: 'Occasion', required: false },
  { key: 'season', header: 'Season', required: false },
  { key: 'careInstructions', header: 'Care Instructions', required: false },
  { key: 'material', header: 'Material', required: false },
  { key: 'countryOfOrigin', header: 'Country Of Origin', required: false },
  { key: 'weight', header: 'Weight (grams)', required: false, tooltip: 'Optional numeric weight in grams.' },
  { key: 'tags', header: 'Tags (Comma Separated)', required: false, tooltip: 'Comma-separated tags.' },
  { key: 'searchKeywords', header: 'Search Keywords (Comma Separated)', required: false, tooltip: 'Comma-separated search keywords.' },
  { key: 'style', header: 'Style', required: false, dropdown: 'style', tooltip: 'AI style attribute (optional).' },
  { key: 'bodyFit', header: 'Body Fit', required: false, dropdown: 'bodyFit' },
  { key: 'recommendedBodyTypes', header: 'Recommended Body Types', required: false, tooltip: 'Comma-separated values from the body-type list.' },
  { key: 'recommendedFaceShapes', header: 'Recommended Face Shapes', required: false, tooltip: 'Comma-separated values from the face-shape list.' },
  { key: 'visibility', header: 'Visibility', required: false, dropdown: 'visibility', tooltip: 'Published, Draft, or Hidden. Defaults to Draft if empty.' },
];

export const BULK_IMPORT_REQUIRED_KEYS = BULK_IMPORT_COLUMNS
  .filter((column) => column.required)
  .map((column) => column.key);

export const BULK_TEMPLATE_CATEGORIES = [
  'Shirts',
  'T-Shirts',
  'Jeans',
  'Trousers',
  'Jackets',
  'Hoodies',
  'Sweatshirts',
  'Shoes',
  'Sneakers',
  'Sandals',
  'Accessories',
  'Ethnic Wear',
  'Formal Wear',
  'Casual Wear',
  'Sportswear',
  'Others',
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

export const BULK_TEMPLATE_GENDERS = ['Male', 'Female', 'Unisex', 'Kids'];

export const BULK_GENDER_TO_CMS = {
  Male: 'Men',
  Female: 'Women',
  Men: 'Men',
  Women: 'Women',
  Unisex: 'Unisex',
  Kids: 'Kids',
};

export const BULK_VISIBILITY_LABELS = ['Published', 'Draft', 'Hidden'];

export const BULK_VISIBILITY_TO_CMS = {
  Published: 'PUBLISHED',
  Draft: 'DRAFT',
  Hidden: 'HIDDEN',
  PUBLISHED: 'PUBLISHED',
  DRAFT: 'DRAFT',
  HIDDEN: 'HIDDEN',
};

export const BULK_ALL_PRODUCT_TYPES = [
  ...new Set(Object.values(CMS_PRODUCT_TYPES_BY_CATEGORY).flat()),
].sort();

export const BULK_ALL_SIZES = [
  ...new Set([
    ...CMS_APPAREL_SIZES,
    ...CMS_JEANS_SIZES,
    ...CMS_SHOE_SIZES,
    ...CMS_ONE_SIZE,
  ]),
];

export const BULK_IMPORT_DROPDOWNS = {
  category: BULK_TEMPLATE_CATEGORIES,
  productType: BULK_ALL_PRODUCT_TYPES,
  gender: BULK_TEMPLATE_GENDERS,
  color: CMS_FASHION_COLORS,
  sizes: BULK_ALL_SIZES,
  style: CMS_AI_STYLES,
  bodyFit: CMS_BODY_FITS,
  visibility: BULK_VISIBILITY_LABELS,
};

export const BULK_IMPORT_TEMPLATE_FILENAME = 'wardrobe-ai-product-import-template.xlsx';

export const BULK_SAMPLE_ROW_MARKER_SKU = 'SAMPLE-REMOVE-BEFORE-UPLOAD';

/** One fully filled sample row — delete before uploading. */
export const BULK_IMPORT_SAMPLE_ROW = {
  sku: BULK_SAMPLE_ROW_MARKER_SKU,
  name: 'Classic White Oxford Shirt',
  brand: 'Wardrobe AI Collection',
  category: 'Shirts',
  productType: 'Shirt',
  gender: 'Male',
  description: 'Premium cotton formal shirt for office wear.',
  mrp: 2999,
  sellingPrice: 2499,
  stockQuantity: 50,
  imageUrl1: 'https://example.com/images/oxford-shirt-front.jpg',
  imageUrl2: 'https://example.com/images/oxford-shirt-back.jpg',
  imageUrl3: '',
  imageUrl4: '',
  color: 'White',
  sizes: 'S,M,L',
  fabric: 'Cotton',
  pattern: 'Solid',
  sleeveType: 'Full Sleeve',
  neckType: 'Spread Collar',
  occasion: 'Office',
  season: 'All Season',
  careInstructions: 'Machine wash cold',
  material: '100% Cotton',
  countryOfOrigin: 'India',
  weight: 220,
  tags: 'formal, office, essential',
  searchKeywords: 'white shirt, oxford, office wear',
  style: 'Smart Casual',
  bodyFit: 'Regular',
  recommendedBodyTypes: 'Athletic, Lean',
  recommendedFaceShapes: 'Oval, Square',
  visibility: 'Draft',
};

export function getBulkTemplateHeaderLabel(column) {
  return column.required ? `${column.header} *` : column.header;
}

export function getBulkTemplateHeaders() {
  return BULK_IMPORT_COLUMNS.map(getBulkTemplateHeaderLabel);
}

export function resolveBulkHeaderToField(header) {
  const normalized = String(header || '')
    .trim()
    .replace(/\s*\*+\s*$/, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();

  const aliasMap = {
    sku: 'sku',
    'product name': 'name',
    name: 'name',
    title: 'name',
    brand: 'brand',
    category: 'category',
    'product type': 'productType',
    producttype: 'productType',
    gender: 'gender',
    description: 'description',
    mrp: 'mrp',
    'selling price': 'sellingPrice',
    sellingprice: 'sellingPrice',
    price: 'sellingPrice',
    'stock quantity': 'stockQuantity',
    stockquantity: 'stockQuantity',
    stock: 'stockQuantity',
    'image 1 url': 'imageUrl1',
    image1url: 'imageUrl1',
    image_url: 'imageUrl1',
    imageurl: 'imageUrl1',
    'image 2 url': 'imageUrl2',
    image2url: 'imageUrl2',
    'image 3 url': 'imageUrl3',
    image3url: 'imageUrl3',
    'image 4 url': 'imageUrl4',
    image4url: 'imageUrl4',
    color: 'color',
    sizes: 'sizes',
    size: 'sizes',
    fabric: 'fabric',
    pattern: 'pattern',
    'sleeve type': 'sleeveType',
    sleevetype: 'sleeveType',
    'neck type': 'neckType',
    necktype: 'neckType',
    occasion: 'occasion',
    season: 'season',
    'care instructions': 'careInstructions',
    careinstructions: 'careInstructions',
    material: 'material',
    'country of origin': 'countryOfOrigin',
    countryoforigin: 'countryOfOrigin',
    'weight (grams)': 'weight',
    weightgrams: 'weight',
    weight: 'weight',
    'tags (comma separated)': 'tags',
    tags: 'tags',
    'search keywords (comma separated)': 'searchKeywords',
    searchkeywords: 'searchKeywords',
    style: 'style',
    'body fit': 'bodyFit',
    bodyfit: 'bodyFit',
    'recommended body types': 'recommendedBodyTypes',
    recommendedbodytypes: 'recommendedBodyTypes',
    'recommended face shapes': 'recommendedFaceShapes',
    recommendedfaceshapes: 'recommendedFaceShapes',
    visibility: 'visibility',
    status: 'visibility',
    variantcolor: 'color',
    variantsize: 'sizes',
  };

  const compact = normalized.replace(/\s+/g, '');
  return aliasMap[normalized] || aliasMap[compact] || null;
}
