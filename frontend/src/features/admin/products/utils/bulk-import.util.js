import * as XLSX from 'xlsx';
import {
  BULK_GENDER_TO_CMS,
  BULK_IMPORT_REQUIRED_KEYS,
  BULK_SAMPLE_ROW_MARKER_SKU,
  BULK_TEMPLATE_CATEGORY_TO_CMS,
  BULK_VISIBILITY_TO_CMS,
  resolveBulkHeaderToField,
} from '../constants/bulk-import-fields.constants';

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

function parseCommaSeparatedList(value) {
  const text = parseOptionalString(value);
  if (!text) return undefined;
  const items = text.split(',').map((item) => item.trim()).filter(Boolean);
  return items.length ? items : undefined;
}

function isValidImageUrl(value) {
  if (!value) return false;
  return /^https?:\/\//i.test(value) || String(value).startsWith('/uploads/');
}

function mapTemplateCategory(category) {
  const text = parseOptionalString(category);
  if (!text) return undefined;
  return BULK_TEMPLATE_CATEGORY_TO_CMS[text] || text;
}

function mapTemplateGender(gender) {
  const text = parseOptionalString(gender);
  if (!text) return undefined;
  return BULK_GENDER_TO_CMS[text] || text;
}

function mapTemplateVisibility(visibility) {
  const text = parseOptionalString(visibility);
  if (!text) return 'DRAFT';
  return BULK_VISIBILITY_TO_CMS[text] || String(text).toUpperCase();
}

function mapRawRow(rawRow) {
  const mapped = {};

  for (const [key, value] of Object.entries(rawRow)) {
    const field = resolveBulkHeaderToField(key);
    if (!field) continue;
    mapped[field] = typeof value === 'string' ? value.trim() : value;
  }

  return mapped;
}

function buildImageList(row) {
  return [
    row.imageUrl1,
    row.imageUrl2,
    row.imageUrl3,
    row.imageUrl4,
    row.imageUrl,
  ]
    .map(parseOptionalString)
    .filter(Boolean);
}

/**
 * Client-side validation aligned with Add Single Product + bulk rules.
 */
export function validateBulkImportRowsClient(rows, { existingSkus = new Set() } = {}) {
  const seenSkus = new Set();
  const seenNames = new Set();
  const validated = [];

  rows.forEach((row, index) => {
    const errors = [];
    const rowNumber = index + 2;

    for (const key of BULK_IMPORT_REQUIRED_KEYS) {
      const value = row[key];
      if (value === undefined || value === null || String(value).trim() === '') {
        const label = key === 'imageUrl1' ? 'Image 1 URL' : key;
        errors.push(`Missing required field: ${label}`);
      }
    }

    if (row.sku) {
      if (seenSkus.has(row.sku)) {
        errors.push(`Duplicate SKU in file: ${row.sku}`);
      }
      seenSkus.add(row.sku);
      if (existingSkus.has(row.sku)) {
        errors.push(`SKU already exists in catalog: ${row.sku}`);
      }
    }

    if (row.name) {
      const normalizedName = String(row.name).trim().toLowerCase();
      if (seenNames.has(normalizedName)) {
        errors.push(`Duplicate product name in file: ${row.name}`);
      }
      seenNames.add(normalizedName);
    }

    const mrp = parseOptionalNumber(row.mrp);
    const sellingPrice = parseOptionalNumber(row.sellingPrice);
    const stockQuantity = parseOptionalNumber(row.stockQuantity);

    if (mrp == null || mrp <= 0) {
      errors.push('MRP must be numeric and greater than 0');
    }

    if (sellingPrice == null || sellingPrice < 0) {
      errors.push('Selling price must be a non-negative number');
    }

    if (mrp != null && sellingPrice != null && sellingPrice > mrp) {
      errors.push('Selling price cannot exceed MRP');
    }

    if (stockQuantity == null || !Number.isInteger(stockQuantity) || stockQuantity <= 0) {
      errors.push('Stock quantity must be a positive integer');
    }

    const images = buildImageList(row);
    if (!images.length || !isValidImageUrl(images[0])) {
      errors.push('Image 1 URL is required and must be a valid image URL');
    }

    for (const imageUrl of images.slice(1)) {
      if (!isValidImageUrl(imageUrl)) {
        errors.push(`Invalid image URL: ${imageUrl}`);
      }
    }

    if (!row.color) {
      errors.push('Color is required');
    }

    if (!row.sizes?.length) {
      errors.push('Sizes is required');
    }

    validated.push({
      rowNumber,
      data: row,
      errors,
      isValid: errors.length === 0,
    });
  });

  const validCount = validated.filter((row) => row.isValid).length;

  return {
    totalRows: validated.length,
    validCount,
    invalidCount: validated.length - validCount,
    canImport: validCount > 0,
    canImportAll: validCount > 0 && validated.every((row) => row.isValid),
    rows: validated,
  };
}

function finalizeBulkRow(mapped, index) {
  const category = mapTemplateCategory(mapped.category);
  const gender = mapTemplateGender(mapped.gender);
  const visibility = mapTemplateVisibility(mapped.visibility);
  const images = buildImageList(mapped);
  const sizes = parseCommaSeparatedList(mapped.sizes) || [];
  const tags = parseCommaSeparatedList(mapped.tags);
  const searchKeywords = parseCommaSeparatedList(mapped.searchKeywords);
  const recommendedBodyTypes = parseCommaSeparatedList(mapped.recommendedBodyTypes);
  const recommendedFaceShapes = parseCommaSeparatedList(mapped.recommendedFaceShapes);

  const base = {
    sku: parseOptionalString(mapped.sku),
    name: parseOptionalString(mapped.name),
    brand: parseOptionalString(mapped.brand),
    category,
    productType: parseOptionalString(mapped.productType),
    gender,
    description: parseOptionalString(mapped.description),
    mrp: parseOptionalNumber(mapped.mrp),
    sellingPrice: parseOptionalNumber(mapped.sellingPrice),
    stockQuantity: parseOptionalNumber(mapped.stockQuantity),
    imageUrl: images[0],
    imageUrls: images,
    fabric: parseOptionalString(mapped.fabric),
    pattern: parseOptionalString(mapped.pattern),
    sleeveType: parseOptionalString(mapped.sleeveType),
    neckType: parseOptionalString(mapped.neckType),
    occasion: parseOptionalString(mapped.occasion),
    season: parseOptionalString(mapped.season),
    careInstructions: parseOptionalString(mapped.careInstructions),
    material: parseOptionalString(mapped.material),
    countryOfOrigin: parseOptionalString(mapped.countryOfOrigin),
    weight: parseOptionalNumber(mapped.weight),
    tags,
    searchKeywords,
    visibility,
    variantColor: parseOptionalString(mapped.color),
    sizes,
  };

  if (mapped.style || mapped.bodyFit || recommendedBodyTypes || recommendedFaceShapes) {
    base.aiAttributes = {
      ...(mapped.style ? { style: parseOptionalString(mapped.style) } : {}),
      ...(mapped.bodyFit ? { bodyFit: parseOptionalString(mapped.bodyFit) } : {}),
      ...(recommendedBodyTypes ? { recommendedBodyTypes } : {}),
      ...(recommendedFaceShapes ? { recommendedFaceShapes } : {}),
    };
  }

  return base;
}

export function normalizeBulkImportRow(rawRow, index = 0) {
  return finalizeBulkRow(mapRawRow(rawRow), index);
}

export function normalizeBulkImportRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  const filtered = rows
    .filter((row) => !isRowEmpty(row))
    .filter((row) => {
      const mapped = mapRawRow(row);
      return mapped.sku !== BULK_SAMPLE_ROW_MARKER_SKU;
    });

  const normalized = filtered.map((row, index) => normalizeBulkImportRow(row, index));
  return normalized;
}

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

export { downloadBulkImportTemplate } from './bulk-import-template.util';
