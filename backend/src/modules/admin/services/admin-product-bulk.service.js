import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  BULK_SAMPLE_ROW_MARKER_SKU,
  CMS_BULK_REQUIRED_COLUMNS,
  CMS_GENDERS,
  CMS_CATEGORIES,
  CMS_VISIBILITY_OPTIONS,
  getCmsProductTypesForCategory,
  isValidCmsColor,
  isValidCmsProductType,
  isValidCmsSize,
  normalizeBulkGender,
  normalizeBulkVisibility,
  normalizeCmsCategory,
} from '../constants/cms-taxonomy.constants';
import { AdminProductCmsRepository } from '../repositories/admin-product-cms.repository';
import { AdminProductCmsService } from './admin-product-cms.service';

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/_([a-z])/g, (_, char) => char.toUpperCase())
    .replace(/^./, (char) => char.toLowerCase());
}

const HEADER_ALIASES = {
  title: 'name',
  productname: 'name',
  'product name': 'name',
  price: 'sellingPrice',
  'selling price': 'sellingPrice',
  discount_price: 'sellingPrice',
  stock: 'stockQuantity',
  'stock quantity': 'stockQuantity',
  producttype: 'productType',
  'product type': 'productType',
  product_type: 'productType',
  imageurl: 'imageUrl',
  image_url: 'imageUrl',
  image1url: 'imageUrl1',
  'image 1 url': 'imageUrl1',
  image2url: 'imageUrl2',
  'image 2 url': 'imageUrl2',
  image3url: 'imageUrl3',
  'image 3 url': 'imageUrl3',
  image4url: 'imageUrl4',
  'image 4 url': 'imageUrl4',
  is_try_on_compatible: 'isTryOnCompatible',
  istryoncompatible: 'isTryOnCompatible',
  sellingprice: 'sellingPrice',
  stockquantity: 'stockQuantity',
  discountpercent: 'discountPercent',
  discount_percent: 'discountPercent',
  taxpercent: 'taxPercent',
  tax_percent: 'taxPercent',
  countryoforigin: 'countryOfOrigin',
  'country of origin': 'countryOfOrigin',
  country_of_origin: 'countryOfOrigin',
  careinstructions: 'careInstructions',
  'care instructions': 'careInstructions',
  care_instructions: 'careInstructions',
  sleevetype: 'sleeveType',
  'sleeve type': 'sleeveType',
  sleeve_type: 'sleeveType',
  necktype: 'neckType',
  'neck type': 'neckType',
  neck_type: 'neckType',
  weightgrams: 'weight',
  'weight (grams)': 'weight',
  weight_grams: 'weight',
  searchkeywords: 'searchKeywords',
  'search keywords (comma separated)': 'searchKeywords',
  search_keywords: 'searchKeywords',
  aistyle: 'aiStyle',
  ai_style: 'aiStyle',
  style: 'aiStyle',
  bodyfit: 'bodyFit',
  'body fit': 'bodyFit',
  body_fit: 'bodyFit',
  recommendedbodytypes: 'recommendedBodyTypes',
  'recommended body types': 'recommendedBodyTypes',
  recommended_body_types: 'recommendedBodyTypes',
  recommendedfaceshapes: 'recommendedFaceShapes',
  'recommended face shapes': 'recommendedFaceShapes',
  recommended_face_shapes: 'recommendedFaceShapes',
  isfeatured: 'isFeatured',
  is_featured: 'isFeatured',
  istrending: 'isTrending',
  is_trending: 'isTrending',
  isnewarrival: 'isNewArrival',
  is_new_arrival: 'isNewArrival',
  isbestseller: 'isBestSeller',
  is_best_seller: 'isBestSeller',
  islimitededition: 'isLimitedEdition',
  is_limited_edition: 'isLimitedEdition',
  variantcolor: 'variantColor',
  variant_color: 'variantColor',
  color: 'variantColor',
  variantsize: 'variantSize',
  variant_size: 'variantSize',
  sizes: 'sizes',
  size: 'sizes',
  variantsku: 'variantSku',
  variant_sku: 'variantSku',
  status: 'visibility',
  'tags (comma separated)': 'tags',
};

function mapRow(rawRow) {
  const mapped = {};

  for (const [key, value] of Object.entries(rawRow)) {
    const normalized = normalizeHeader(key);
    const compact = String(key || '').trim().replace(/\s*\*+\s*$/, '').toLowerCase();
    const field = HEADER_ALIASES[normalized]
      || HEADER_ALIASES[compact]
      || normalized;
    mapped[field] = typeof value === 'string' ? value.trim() : value;
  }

  if (mapped.color && !mapped.variantColor) {
    mapped.variantColor = mapped.color;
  }

  if (mapped.sizes && !mapped.variantSize) {
    const sizes = parseCommaSeparatedList(mapped.sizes);
    if (sizes?.length) {
      mapped.sizes = sizes;
    }
  }

  const imageUrls = [
    mapped.imageUrl1,
    mapped.imageUrl2,
    mapped.imageUrl3,
    mapped.imageUrl4,
    mapped.imageUrl,
    ...(Array.isArray(mapped.imageUrls) ? mapped.imageUrls : []),
  ]
    .map(parseOptionalString)
    .filter(Boolean);

  if (imageUrls.length) {
    mapped.imageUrls = [...new Set(imageUrls)];
    mapped.imageUrl = mapped.imageUrls[0];
  }

  delete mapped.imageUrl1;
  delete mapped.imageUrl2;
  delete mapped.imageUrl3;
  delete mapped.imageUrl4;
  delete mapped.color;

  return mapped;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function isBlank(value) {
  return value == null || value === '';
}

function parseOptionalString(value) {
  if (isBlank(value)) {
    return undefined;
  }

  const text = String(value).trim();
  return text === '' ? undefined : text;
}

function parseOptionalBoolean(value) {
  const text = parseOptionalString(value);
  if (text == null) {
    return undefined;
  }

  const normalized = text.toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false;
  }

  return undefined;
}

function parseCommaSeparatedList(value) {
  const text = parseOptionalString(value);
  if (!text) {
    return undefined;
  }

  const items = text.split(',').map((item) => item.trim()).filter(Boolean);
  return items.length ? items : undefined;
}

function normalizeOptionalRowFields(row) {
  const normalized = { ...row };

  const stringFields = [
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
    'description',
    'imageUrl',
  ];

  for (const field of stringFields) {
    if (field in normalized) {
      const parsed = parseOptionalString(normalized[field]);
      if (parsed == null) {
        delete normalized[field];
      } else {
        normalized[field] = parsed;
      }
    }
  }

  if ('discountPercent' in normalized && isBlank(normalized.discountPercent)) {
    delete normalized.discountPercent;
  }

  if ('taxPercent' in normalized && isBlank(normalized.taxPercent)) {
    delete normalized.taxPercent;
  }

  if ('weight' in normalized && isBlank(normalized.weight)) {
    delete normalized.weight;
  }

  if ('variantStock' in normalized && isBlank(normalized.variantStock)) {
    delete normalized.variantStock;
  }

  if ('tags' in normalized) {
    const tags = Array.isArray(normalized.tags)
      ? normalized.tags.filter(Boolean)
      : parseCommaSeparatedList(normalized.tags);

    if (tags?.length) {
      normalized.tags = tags;
    } else {
      delete normalized.tags;
    }
  }

  if ('searchKeywords' in normalized) {
    const keywords = Array.isArray(normalized.searchKeywords)
      ? normalized.searchKeywords.filter(Boolean)
      : parseCommaSeparatedList(normalized.searchKeywords);

    if (keywords?.length) {
      normalized.searchKeywords = keywords;
    } else {
      delete normalized.searchKeywords;
    }
  }

  const recommendedBodyTypes = Array.isArray(normalized.recommendedBodyTypes)
    ? normalized.recommendedBodyTypes.filter(Boolean)
    : parseCommaSeparatedList(normalized.recommendedBodyTypes);
  const recommendedFaceShapes = Array.isArray(normalized.recommendedFaceShapes)
    ? normalized.recommendedFaceShapes.filter(Boolean)
    : parseCommaSeparatedList(normalized.recommendedFaceShapes);

  delete normalized.recommendedBodyTypes;
  delete normalized.recommendedFaceShapes;

  const aiAttributes = normalized.aiAttributes || {};
  if (normalized.aiStyle) {
    aiAttributes.style = normalized.aiStyle;
  }
  if (normalized.bodyFit) {
    aiAttributes.bodyFit = normalized.bodyFit;
  }
  if (recommendedBodyTypes?.length) {
    aiAttributes.recommendedBodyTypes = recommendedBodyTypes;
  }
  if (recommendedFaceShapes?.length) {
    aiAttributes.recommendedFaceShapes = recommendedFaceShapes;
  }

  delete normalized.aiStyle;
  delete normalized.bodyFit;

  if (Object.keys(aiAttributes).length) {
    normalized.aiAttributes = aiAttributes;
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
    if (field in normalized) {
      const parsed = parseOptionalBoolean(normalized[field]);
      if (parsed == null) {
        delete normalized[field];
      } else {
        normalized[field] = parsed;
      }
    }
  }

  return normalized;
}

export @Injectable()
class AdminProductBulkService {
  constructor(
    @Inject(AdminProductCmsRepository) cmsRepository,
    @Inject(AdminProductCmsService) cmsService,
  ) {
    this.cmsRepository = cmsRepository;
    this.cmsService = cmsService;
  }

  async validateRows(rows) {
    if (!Array.isArray(rows) || !rows.length) {
      throw new BadRequestException('Import file must contain at least one data row.');
    }

    const seenSkus = new Set();
    const seenNames = new Set();
    const seenBarcodes = new Set();
    const validated = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = normalizeOptionalRowFields(mapRow(rows[index]));

      if (row.sku === BULK_SAMPLE_ROW_MARKER_SKU) {
        continue;
      }

      const errors = [];
      const rowNumber = index + 2;

      row.category = normalizeCmsCategory(row.category);
      row.gender = normalizeBulkGender(row.gender);
      row.visibility = normalizeBulkVisibility(row.visibility);

      if (!row.variantColor && row.color) {
        row.variantColor = row.color;
      }

      for (const column of CMS_BULK_REQUIRED_COLUMNS) {
        if (column === 'imageUrl') {
          if (!row.imageUrl) {
            errors.push('Missing required field: Image 1 URL');
          }
          continue;
        }

        if (!row[column] && row[column] !== 0) {
          errors.push(`Missing required field: ${column}`);
        }
      }

      const productType = row.productType;

      if (row.category && !CMS_CATEGORIES.includes(row.category)) {
        errors.push(`Invalid category: ${rows[index].category}`);
      }

      if (row.gender && !CMS_GENDERS.includes(row.gender)) {
        errors.push(`Invalid gender: ${rows[index].gender}`);
      }

      if (productType && row.category && !isValidCmsProductType(productType, row.category)) {
        errors.push(`Invalid product type "${productType}" for category "${rows[index].category}"`);
      } else if (productType && !isValidCmsProductType(productType)) {
        const allowed = getCmsProductTypesForCategory(row.category || 'Clothing');
        if (!allowed.includes(productType)) {
          errors.push(`Invalid product type: ${productType}`);
        }
      }

      if (row.sku) {
        if (seenSkus.has(row.sku)) {
          errors.push(`Duplicate SKU in file: ${row.sku}`);
        }
        seenSkus.add(row.sku);

        const existing = await this.cmsRepository.findProductBySku(row.sku);
        if (existing) {
          errors.push(`SKU already exists in catalog: ${row.sku}`);
        }
      } else {
        errors.push('SKU is required');
      }

      if (row.name) {
        const normalizedName = String(row.name).trim().toLowerCase();
        if (seenNames.has(normalizedName)) {
          errors.push(`Duplicate product name in file: ${row.name}`);
        }
        seenNames.add(normalizedName);
      }

      if (row.variantSku) {
        if (seenSkus.has(row.variantSku)) {
          errors.push(`Duplicate variant SKU in file: ${row.variantSku}`);
        }
        seenSkus.add(row.variantSku);

        const existingVariant = await this.cmsRepository.findVariantBySku(row.variantSku);
        if (existingVariant) {
          errors.push(`Variant SKU already exists: ${row.variantSku}`);
        }
      }

      if (row.barcode) {
        if (seenBarcodes.has(row.barcode)) {
          errors.push(`Duplicate barcode in file: ${row.barcode}`);
        }
        seenBarcodes.add(row.barcode);

        const existingBarcode = await this.cmsRepository.findByBarcode(row.barcode);
        if (existingBarcode) {
          errors.push(`Barcode already exists: ${row.barcode}`);
        }
      }

      const sellingPrice = toNumber(row.sellingPrice);
      const mrp = row.mrp != null && row.mrp !== '' ? toNumber(row.mrp) : sellingPrice;
      const stockQuantity = toNumber(row.stockQuantity);

      if (Number.isNaN(mrp) || mrp <= 0) {
        errors.push('MRP must be numeric and greater than 0');
      }

      if (Number.isNaN(sellingPrice) || sellingPrice < 0) {
        errors.push('Selling price must be a non-negative number');
      }

      if (!Number.isNaN(sellingPrice) && !Number.isNaN(mrp) && sellingPrice > mrp) {
        errors.push('Selling price cannot exceed MRP');
      }

      if (Number.isNaN(stockQuantity) || !Number.isInteger(stockQuantity) || stockQuantity <= 0) {
        errors.push('Stock quantity must be a positive integer');
      }

      if (!row.variantColor) {
        errors.push('Color is required');
      } else if (!isValidCmsColor(row.variantColor)) {
        errors.push(`Invalid color: ${row.variantColor}`);
      }

      const sizeList = Array.isArray(row.sizes) && row.sizes.length
        ? row.sizes
        : [row.variantSize].filter(Boolean);

      if (!sizeList.length) {
        errors.push('Sizes is required');
      } else {
        for (const size of sizeList) {
          if (productType && !isValidCmsSize(size, productType)) {
            errors.push(`Invalid size "${size}" for product type "${productType}"`);
          }
        }
      }

      row.sizes = sizeList;

      if (!row.imageUrl) {
        errors.push('Image 1 URL is required');
      } else if (!/^https?:\/\//i.test(row.imageUrl) && !row.imageUrl.startsWith('/uploads/')) {
        errors.push('Invalid image URL — must be a valid http(s) URL or stored upload path');
      }

      if (row.visibility && !CMS_VISIBILITY_OPTIONS.includes(row.visibility)) {
        errors.push(`Invalid visibility/status: ${rows[index].visibility}`);
      }

      if (row.discountPercent != null && row.discountPercent !== '') {
        const discountPercent = toNumber(row.discountPercent);
        if (Number.isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
          errors.push('Discount percent must be between 0 and 100');
        }
      }

      if (row.taxPercent != null && row.taxPercent !== '') {
        const taxPercent = toNumber(row.taxPercent);
        if (Number.isNaN(taxPercent) || taxPercent < 0 || taxPercent > 100) {
          errors.push('Tax percent must be between 0 and 100');
        }
      }

      if (row.weight != null && row.weight !== '') {
        const weight = toNumber(row.weight);
        if (Number.isNaN(weight) || weight < 0) {
          errors.push('Weight must be a non-negative number');
        }
      }

      validated.push({
        rowNumber,
        data: {
          ...row,
          mrp,
          sellingPrice,
          stockQuantity,
        },
        errors,
        isValid: errors.length === 0,
      });
    }

    if (!validated.length) {
      throw new BadRequestException('Import file must contain at least one product row (sample row is ignored).');
    }

    const validCount = validated.filter((row) => row.isValid).length;

    return {
      totalRows: validated.length,
      validCount,
      invalidCount: validated.length - validCount,
      canImport: validCount > 0 && validated.every((row) => row.isValid),
      canImportPartial: validCount > 0,
      rows: validated,
    };
  }

  async importRows(rows, adminUserId) {
    const validation = await this.validateRows(rows);

    if (!validation.canImport) {
      throw new BadRequestException({
        message: 'Import blocked due to validation errors',
        validation,
      });
    }

    const grouped = this.groupRowsBySku(validation.rows.map((row) => row.data));
    const created = [];

    for (const group of grouped) {
      const product = await this.cmsService.createProduct(group, adminUserId);
      created.push(product);
    }

    return {
      imported: created.length,
      products: created,
      validation,
    };
  }

  groupRowsBySku(rows) {
    const map = new Map();

    for (const row of rows) {
      const key = row.sku;
      if (!map.has(key)) {
        map.set(key, {
          sku: row.sku,
          name: row.name,
          brand: row.brand,
          category: row.category,
          productType: row.productType,
          gender: row.gender,
          mrp: toNumber(row.mrp),
          sellingPrice: toNumber(row.sellingPrice),
          discountPercent: row.discountPercent != null && row.discountPercent !== ''
            ? toNumber(row.discountPercent)
            : undefined,
          taxPercent: row.taxPercent != null && row.taxPercent !== ''
            ? toNumber(row.taxPercent)
            : undefined,
          stockQuantity: toNumber(row.stockQuantity),
          barcode: row.barcode || null,
          description: row.description || null,
          visibility: row.visibility || 'DRAFT',
          fabric: row.fabric || null,
          fit: row.fit || null,
          pattern: row.pattern || null,
          sleeveType: row.sleeveType || null,
          neckType: row.neckType || null,
          occasion: row.occasion || null,
          season: row.season || null,
          careInstructions: row.careInstructions || null,
          countryOfOrigin: row.countryOfOrigin || null,
          material: row.material || null,
          weight: row.weight != null && row.weight !== '' ? toNumber(row.weight) : undefined,
          tags: row.tags || undefined,
          searchKeywords: row.searchKeywords || undefined,
          aiAttributes: row.aiAttributes || undefined,
          isTryOnCompatible: row.isTryOnCompatible,
          isFeatured: row.isFeatured,
          isTrending: row.isTrending,
          isNewArrival: row.isNewArrival,
          isBestSeller: row.isBestSeller,
          isLimitedEdition: row.isLimitedEdition,
          images: this.collectImages(row),
          variants: [],
        });
      }

      const entry = map.get(key);

      const sizes = Array.isArray(row.sizes) && row.sizes.length
        ? row.sizes
        : [row.variantSize].filter(Boolean);

      if (row.variantColor && sizes.length) {
        const stockPerVariant = Math.max(1, Math.floor(toNumber(row.stockQuantity) / sizes.length));

        sizes.forEach((size, sizeIndex) => {
          entry.variants.push({
            color: row.variantColor,
            size,
            stock: sizeIndex === sizes.length - 1
              ? toNumber(row.stockQuantity) - stockPerVariant * (sizes.length - 1)
              : stockPerVariant,
            sku: row.sku ? `${row.sku}-${String(size).replace(/\s+/g, '').toUpperCase()}` : undefined,
          });
        });
      } else if (row.variantColor && row.variantSize) {
        entry.variants.push({
          color: row.variantColor,
          size: row.variantSize,
          stock: row.variantStock != null ? toNumber(row.variantStock) : toNumber(row.stockQuantity) || 0,
          sku: row.variantSku || undefined,
        });
      }
    }

    return [...map.values()];
  }

  collectImages(row) {
    const urls = Array.isArray(row.imageUrls) && row.imageUrls.length
      ? row.imageUrls
      : [row.imageUrl].filter(Boolean);

    return urls.map((url, index) => ({
      url,
      sortOrder: index,
      isPrimary: index === 0,
    }));
  }

  generateImportSku(name, index) {
    const slug = String(name || 'product')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 12) || 'PRODUCT';

    return `BULK-${slug}-${String(index + 1).padStart(3, '0')}`;
  }
}
