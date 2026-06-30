import * as XLSX from 'xlsx';
import {
  BULK_IMPORT_TEMPLATE_FILENAME,
  BULK_IMPORT_TEMPLATE_HEADERS,
  BULK_IMPORT_TEMPLATE_SAMPLES,
} from '../constants/bulk-import.constants';

const HEADER_FIELD_MAP = {
  title: 'name',
  name: 'name',
  description: 'description',
  price: 'sellingPrice',
  sellingprice: 'sellingPrice',
  discount_price: 'sellingPrice',
  stock: 'stockQuantity',
  stockquantity: 'stockQuantity',
  category: 'category',
  product_type: 'productType',
  producttype: 'productType',
  gender: 'gender',
  brand: 'brand',
  image_url: 'imageUrl',
  imageurl: 'imageUrl',
  is_try_on_compatible: 'isTryOnCompatible',
  istryoncompatible: 'isTryOnCompatible',
  sku: 'sku',
  mrp: 'mrp',
  discount_percent: 'discountPercent',
  discountpercent: 'discountPercent',
  tax_percent: 'taxPercent',
  taxpercent: 'taxPercent',
  barcode: 'barcode',
  visibility: 'visibility',
  status: 'visibility',
  fabric: 'fabric',
  fit: 'fit',
  pattern: 'pattern',
  sleeve_type: 'sleeveType',
  sleevetype: 'sleeveType',
  neck_type: 'neckType',
  necktype: 'neckType',
  occasion: 'occasion',
  season: 'season',
  care_instructions: 'careInstructions',
  careinstructions: 'careInstructions',
  country_of_origin: 'countryOfOrigin',
  countryoforigin: 'countryOfOrigin',
  material: 'material',
  weight_grams: 'weight',
  weightgrams: 'weight',
  weight: 'weight',
  tags: 'tags',
  search_keywords: 'searchKeywords',
  searchkeywords: 'searchKeywords',
  ai_style: 'aiStyle',
  aistyle: 'aiStyle',
  body_fit: 'bodyFit',
  bodyfit: 'bodyFit',
  recommended_body_types: 'recommendedBodyTypes',
  recommendedbodytypes: 'recommendedBodyTypes',
  recommended_face_shapes: 'recommendedFaceShapes',
  recommendedfaceshapes: 'recommendedFaceShapes',
  is_featured: 'isFeatured',
  isfeatured: 'isFeatured',
  is_trending: 'isTrending',
  istrending: 'isTrending',
  is_new_arrival: 'isNewArrival',
  isnewarrival: 'isNewArrival',
  is_best_seller: 'isBestSeller',
  isbestseller: 'isBestSeller',
  is_limited_edition: 'isLimitedEdition',
  islimitededition: 'isLimitedEdition',
  variant_color: 'variantColor',
  variantcolor: 'variantColor',
  variant_size: 'variantSize',
  variantsize: 'variantSize',
  variant_stock: 'variantStock',
  variantstock: 'variantStock',
  variant_sku: 'variantSku',
  variantsku: 'variantSku',
};

function normalizeHeaderKey(header) {
  return String(header || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/_([a-z])/g, (_, char) => char.toUpperCase())
    .replace(/^./, (char) => char.toLowerCase());
}

function resolveFieldName(header) {
  const normalized = normalizeHeaderKey(header);
  return HEADER_FIELD_MAP[normalized]
    || HEADER_FIELD_MAP[String(header).trim().toLowerCase()]
    || normalized;
}

function slugifySkuPart(value) {
  return String(value || 'product')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 12) || 'PRODUCT';
}

function isRowEmpty(row) {
  return !Object.values(row).some((value) => {
    if (value === null || value === undefined) return false;
    return String(value).trim() !== '';
  });
}

function parseOptionalString(value) {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text === '' ? undefined : text;
}

function parseOptionalNumber(value) {
  if (value == null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalBoolean(value) {
  const text = parseOptionalString(value);
  if (text == null) return undefined;

  const normalized = text.toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return undefined;
}

function parseCommaSeparatedList(value) {
  const text = parseOptionalString(value);
  if (!text) return undefined;

  const items = text.split(',').map((item) => item.trim()).filter(Boolean);
  return items.length ? items : undefined;
}

function applyOptionalFieldTransforms(mapped) {
  const next = { ...mapped };

  const stringFields = [
    'description',
    'sku',
    'barcode',
    'visibility',
    'fabric',
    'fit',
    'pattern',
    'sleeveType',
    'neckType',
    'occasion',
    'season',
    'careInstructions',
    'countryOfOrigin',
    'material',
    'aiStyle',
    'bodyFit',
    'variantColor',
    'variantSize',
    'variantSku',
    'imageUrl',
  ];

  for (const field of stringFields) {
    if (field in next) {
      const parsed = parseOptionalString(next[field]);
      if (parsed == null) {
        delete next[field];
      } else {
        next[field] = parsed;
      }
    }
  }

  const numberFields = [
    'sellingPrice',
    'stockQuantity',
    'mrp',
    'discountPercent',
    'taxPercent',
    'weight',
    'variantStock',
  ];

  for (const field of numberFields) {
    if (field in next) {
      const parsed = parseOptionalNumber(next[field]);
      if (parsed == null) {
        delete next[field];
      } else {
        next[field] = parsed;
      }
    }
  }

  const booleanFields = [
    'isTryOnCompatible',
    'isFeatured',
    'isTrending',
    'isNewArrival',
    'isBestSeller',
    'isLimitedEdition',
  ];

  for (const field of booleanFields) {
    if (field in next) {
      const parsed = parseOptionalBoolean(next[field]);
      if (parsed == null) {
        delete next[field];
      } else {
        next[field] = parsed;
      }
    }
  }

  if ('tags' in next) {
    const tags = parseCommaSeparatedList(next.tags);
    if (tags) {
      next.tags = tags;
    } else {
      delete next.tags;
    }
  }

  if ('searchKeywords' in next) {
    const keywords = parseCommaSeparatedList(next.searchKeywords);
    if (keywords) {
      next.searchKeywords = keywords;
    } else {
      delete next.searchKeywords;
    }
  }

  if ('recommendedBodyTypes' in next) {
    const bodyTypes = parseCommaSeparatedList(next.recommendedBodyTypes);
    if (bodyTypes) {
      next.recommendedBodyTypes = bodyTypes;
    } else {
      delete next.recommendedBodyTypes;
    }
  }

  if ('recommendedFaceShapes' in next) {
    const faceShapes = parseCommaSeparatedList(next.recommendedFaceShapes);
    if (faceShapes) {
      next.recommendedFaceShapes = faceShapes;
    } else {
      delete next.recommendedFaceShapes;
    }
  }

  const aiStyle = next.aiStyle;
  const bodyFit = next.bodyFit;
  const recommendedBodyTypes = next.recommendedBodyTypes;
  const recommendedFaceShapes = next.recommendedFaceShapes;

  delete next.aiStyle;
  delete next.bodyFit;
  delete next.recommendedBodyTypes;
  delete next.recommendedFaceShapes;

  if (aiStyle || bodyFit || recommendedBodyTypes || recommendedFaceShapes) {
    next.aiAttributes = {
      ...(aiStyle ? { style: aiStyle } : {}),
      ...(bodyFit ? { bodyFit } : {}),
      ...(recommendedBodyTypes ? { recommendedBodyTypes } : {}),
      ...(recommendedFaceShapes ? { recommendedFaceShapes } : {}),
    };
  }

  return next;
}

/**
 * Map a parsed spreadsheet row to the bulk import API shape.
 */
export function normalizeBulkImportRow(rawRow, index = 0) {
  const mapped = {};

  for (const [key, value] of Object.entries(rawRow)) {
    const field = resolveFieldName(key);
    mapped[field] = typeof value === 'string' ? value.trim() : value;
  }

  if (!mapped.name && mapped.title) {
    mapped.name = mapped.title;
  }

  if (mapped.sellingPrice == null && mapped.price != null) {
    mapped.sellingPrice = mapped.price;
  }

  if (mapped.stockQuantity == null && mapped.stock != null) {
    mapped.stockQuantity = mapped.stock;
  }

  if (mapped.productType == null && mapped.product_type != null) {
    mapped.productType = mapped.product_type;
  }

  if (mapped.imageUrl == null && mapped.image_url != null) {
    mapped.imageUrl = mapped.image_url;
  }

  const normalized = applyOptionalFieldTransforms(mapped);

  if (!normalized.sku && normalized.name) {
    normalized.sku = `BULK-${slugifySkuPart(normalized.name)}-${String(index + 1).padStart(3, '0')}`;
  }

  if (normalized.mrp == null && normalized.sellingPrice != null) {
    normalized.mrp = normalized.sellingPrice;
  }

  delete normalized.title;
  delete normalized.price;
  delete normalized.stock;
  delete normalized.product_type;
  delete normalized.image_url;

  return normalized;
}

export function normalizeBulkImportRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .filter((row) => !isRowEmpty(row))
    .map((row, index) => normalizeBulkImportRow(row, index));
}

/**
 * Parse CSV or Excel file into normalized bulk import rows.
 */
export function parseBulkImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        if (!buffer) {
          reject(new Error('Unable to read file.'));
          return;
        }

        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];

        if (!sheetName) {
          reject(new Error('The file does not contain any worksheets.'));
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        resolve(normalizeBulkImportRows(rawRows));
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse import file.'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read import file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate and download the Excel template workbook client-side.
 */
export function downloadBulkImportTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    BULK_IMPORT_TEMPLATE_HEADERS,
    ...BULK_IMPORT_TEMPLATE_SAMPLES,
  ]);

  worksheet['!cols'] = BULK_IMPORT_TEMPLATE_HEADERS.map((header) => ({
    wch: Math.max(header.length + 4, 18),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  XLSX.writeFile(workbook, BULK_IMPORT_TEMPLATE_FILENAME);
}
