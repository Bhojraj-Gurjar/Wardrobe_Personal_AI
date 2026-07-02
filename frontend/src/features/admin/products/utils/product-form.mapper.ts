import {
  computeDiscountPercent,
  defaultProductFormValues,
  type ProductFormValues,
} from '../schemas/product-form.schema';
import {
  getProductTypesForCategory,
  resolveCmsCategory,
} from '../constants/cms-taxonomy';
import { buildColorVariantSku, buildSizeVariantSku, buildVariantSku } from './sku.util';

type ProductDetail = Record<string, unknown>;

const PLACEHOLDER_PRODUCT_TYPE = 'T-Shirt';

function readStoredProductType(product: ProductDetail) {
  const raw = product.productType ?? product.product_type;
  return typeof raw === 'string' ? raw.trim() : '';
}

function resolveEditableProductType(product: ProductDetail, category: string) {
  const stored = readStoredProductType(product);

  if (stored && stored !== PLACEHOLDER_PRODUCT_TYPE) {
    return stored;
  }

  const types = getProductTypesForCategory(category);

  if (stored === PLACEHOLDER_PRODUCT_TYPE && types.length && !types.includes(PLACEHOLDER_PRODUCT_TYPE)) {
    return types[0] ?? '';
  }

  if (stored) {
    return stored;
  }

  return '';
}

function readOptionalNumber(value: unknown) {
  if (value == null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function mapProductDetailToFormValues(product: ProductDetail): ProductFormValues {
  const aiAttributes = (product.aiAttributes ?? {}) as Record<string, unknown>;
  const category = String(product.category ?? '');

  const images = Array.isArray(product.images) && product.images.length
    ? (product.images as Array<Record<string, unknown>>).map((image, index) => ({
        id: String(image.id ?? `existing-${index}`),
        url: String(image.url ?? ''),
        preview: String(image.url ?? ''),
        isPrimary: Boolean(image.isPrimary ?? index === 0),
        sortOrder: Number(image.sortOrder ?? index),
      }))
    : product.imageUrl
      ? [{
          id: 'existing-primary',
          url: String(product.imageUrl),
          preview: String(product.imageUrl),
          isPrimary: true,
          sortOrder: 0,
        }]
      : [];

  const visibility = String(product.visibility || defaultProductFormValues.visibility).toUpperCase();
  const normalizedVisibility = ['DRAFT', 'PUBLISHED', 'HIDDEN', 'OUT_OF_STOCK'].includes(visibility)
    ? visibility
    : defaultProductFormValues.visibility;

  return {
    ...defaultProductFormValues,
    name: String(product.name ?? ''),
    brand: String(product.brand ?? ''),
    description: String(product.description ?? ''),
    category: resolveCmsCategory(category) || category,
    productType: resolveEditableProductType(product, resolveCmsCategory(category) || category),
    gender: String(product.gender ?? ''),
    mrp: readOptionalNumber(product.mrp),
    sellingPrice: readOptionalNumber(product.price ?? product.sellingPrice),
    discountPercent: readOptionalNumber(product.discountPercent),
    taxPercent: readOptionalNumber(product.taxPercent),
    stockQuantity: readOptionalNumber(product.stock ?? product.stockQuantity),
    sku: String(product.sku ?? ''),
    barcode: String(product.barcode ?? ''),
    images,
    variants: Array.isArray(product.variants)
      ? (product.variants as Array<Record<string, unknown>>).map((variant, index) => ({
          id: String(variant.id ?? `existing-variant-${index}`),
          color: String(variant.color ?? ''),
          size: String(variant.size ?? ''),
          stock: readOptionalNumber(variant.stock),
          sku: variant.sku ? String(variant.sku) : undefined,
          priceOverride: variant.priceOverride != null ? Number(variant.priceOverride) : null,
          imageUrl: variant.imageUrl ? String(variant.imageUrl) : null,
        }))
      : [],
    fabric: String(product.fabric ?? ''),
    fit: String(product.fit ?? ''),
    pattern: String(product.pattern ?? ''),
    sleeveType: String(product.sleeveType ?? ''),
    neckType: String(product.neckType ?? ''),
    occasion: String(product.occasion ?? ''),
    season: String(product.season ?? ''),
    careInstructions: String(product.careInstructions ?? ''),
    countryOfOrigin: String(product.countryOfOrigin ?? ''),
    material: String(product.material ?? ''),
    weight: readOptionalNumber(product.weight),
    dimensions: product.dimensions as ProductFormValues['dimensions'],
    tags: Array.isArray(product.tags) ? product.tags.map(String) : [],
    searchKeywords: Array.isArray(product.searchKeywords)
      ? product.searchKeywords.map(String)
      : [],
    aiAttributes: {
      style: String(aiAttributes.style ?? ''),
      bodyFit: String(aiAttributes.bodyFit ?? ''),
      recommendedBodyTypes: Array.isArray(aiAttributes.recommendedBodyTypes)
        ? aiAttributes.recommendedBodyTypes.map(String)
        : [],
      recommendedFaceShapes: Array.isArray(aiAttributes.recommendedFaceShapes)
        ? aiAttributes.recommendedFaceShapes.map(String)
        : [],
    },
    visibility: normalizedVisibility as ProductFormValues['visibility'],
    isFeatured: Boolean(product.isFeatured),
    isTrending: Boolean(product.isTrending),
    isNewArrival: Boolean(product.isNewArrival),
    isBestSeller: Boolean(product.isBestSeller),
    isLimitedEdition: Boolean(product.isLimitedEdition),
  };
}

function resolveEffectiveMrp(values: ProductFormValues) {
  const mrp = Number(values.mrp) || 0;
  const sellingPrice = Number(values.sellingPrice) || 0;
  return mrp > 0 ? mrp : sellingPrice;
}

function normalizeVariantsForPayload(values: ProductFormValues) {
  if (!values.variants?.length) {
    return undefined;
  }

  const baseSku = values.sku?.trim() || '';

  return values.variants.map((variant) => ({
    color: variant.color,
    size: variant.size,
    stock: variant.stock ?? 0,
    sku: variant.sku || buildVariantSku(baseSku, variant.color, variant.size),
    priceOverride: variant.priceOverride,
  }));
}

export function buildProductMutationPayload(
  values: ProductFormValues,
  options?: { draftWizardStep?: number },
) {
  const sellingPrice = values.sellingPrice ?? 0;
  const mrp = resolveEffectiveMrp({ ...values, sellingPrice });
  const discountPercent = computeDiscountPercent(
    values.mrp ?? mrp,
    values.sellingPrice ?? sellingPrice,
  ) ?? values.discountPercent ?? 0;

  const normalizedVariants = normalizeVariantsForPayload(values);

  return {
    name: values.name.trim(),
    brand: values.brand.trim(),
    description: values.description?.trim() || undefined,
    category: resolveCmsCategory(values.category) || values.category,
    productType: values.productType,
    gender: values.gender,
    mrp,
    sellingPrice,
    discountPercent,
    taxPercent: values.taxPercent ?? 0,
    stockQuantity: normalizedVariants?.length
      ? normalizedVariants.reduce((sum, variant) => sum + (variant.stock || 0), 0)
      : values.stockQuantity ?? 0,
    sku: values.sku?.trim() || undefined,
    barcode: values.barcode?.trim() || undefined,
    fabric: values.fabric || undefined,
    fit: values.fit || undefined,
    pattern: values.pattern || undefined,
    sleeveType: values.sleeveType || undefined,
    neckType: values.neckType || undefined,
    occasion: values.occasion || undefined,
    season: values.season || undefined,
    careInstructions: values.careInstructions || undefined,
    countryOfOrigin: values.countryOfOrigin || undefined,
    material: values.material || undefined,
    weight: values.weight,
    dimensions: values.dimensions,
    tags: values.tags?.length ? values.tags : undefined,
    searchKeywords: values.searchKeywords?.length ? values.searchKeywords : undefined,
    aiAttributes: values.aiAttributes,
    visibility: values.visibility,
    isFeatured: values.isFeatured,
    isTrending: values.isTrending,
    isNewArrival: values.isNewArrival,
    isBestSeller: values.isBestSeller,
    isLimitedEdition: values.isLimitedEdition,
    variants: normalizedVariants,
    images: values.images
      ?.filter((image) => image.url && !image.file)
      .map((image, index) => ({
        url: image.url,
        sortOrder: index,
        isPrimary: image.isPrimary ?? index === 0,
      })),
    ...(options?.draftWizardStep != null
      ? { draftWizardStep: options.draftWizardStep }
      : {}),
  };
}

export function buildVariantProductPayload(
  baseValues: ProductFormValues,
  spec: {
    type: 'color' | 'size';
    value: string;
    sellingPrice: number;
    stock: number;
  },
) {
  const baseSku = baseValues.sku.trim();
  const baseColor = baseValues.variants?.[0]?.color || 'White';
  const baseSize = baseValues.variants?.[0]?.size || 'M';
  const color = spec.type === 'color' ? spec.value : baseColor;
  const size = spec.type === 'size' ? spec.value : baseSize;
  const variantSku = spec.type === 'color'
    ? buildColorVariantSku(baseSku, spec.value)
    : buildSizeVariantSku(baseSku, spec.value);

  if (!variantSku) {
    throw new Error('Base SKU is required to create a variant product.');
  }

  return buildProductMutationPayload({
    ...baseValues,
    sku: variantSku,
    mrp: spec.sellingPrice,
    sellingPrice: spec.sellingPrice,
    stockQuantity: spec.stock,
    variants: [{
      color,
      size,
      stock: spec.stock,
      sku: buildVariantSku(variantSku, color, size),
    }],
    visibility: 'DRAFT',
  });
}
