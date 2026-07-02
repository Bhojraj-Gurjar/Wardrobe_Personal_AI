import { z } from 'zod';

function emptyToUndefined(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  return value;
}

function parseOptionalNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

const optionalNumber = z.preprocess(
  parseOptionalNumber,
  z.number({ invalid_type_error: 'Enter a valid number' }).min(0, 'Value must be zero or greater').optional(),
);

const variantSchema = z.object({
  id: z.string().optional(),
  color: z.string().min(1, 'Color is required'),
  size: z.string().min(1, 'Size is required'),
  stock: z.preprocess(
    parseOptionalNumber,
    z.number({ invalid_type_error: 'Stock is required' }).int().min(0, 'Stock is required'),
  ),
  sku: z.string().optional(),
  priceOverride: z.preprocess(
    parseOptionalNumber,
    z.number().min(0).optional().nullable(),
  ),
  imageUrl: z.string().optional().nullable(),
});

const imageSchema = z.object({
  id: z.string().optional(),
  url: z.string().optional(),
  sortOrder: z.number().optional(),
  isPrimary: z.boolean().optional(),
  file: z.any().optional(),
  preview: z.string().optional(),
}).refine((data) => Boolean(data.url || data.preview || data.file), {
  message: 'Image asset is required',
});

export const STEP_ONE_REQUIRED_FIELDS = [
  'sku',
  'name',
  'brand',
  'category',
  'productType',
  'gender',
] as const;

export const productFormSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  brand: z.string().min(1, 'Brand is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  productType: z.string().min(1, 'Product type is required'),
  gender: z.string().min(1, 'Gender is required'),
  mrp: optionalNumber,
  sellingPrice: optionalNumber,
  discountPercent: optionalNumber,
  taxPercent: optionalNumber,
  stockQuantity: z.preprocess(
    parseOptionalNumber,
    z.number().int().min(0).optional(),
  ),
  sku: z.string().trim().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  images: z.array(imageSchema),
  variants: z.array(variantSchema).optional(),
  fabric: z.string().optional(),
  fit: z.string().optional(),
  pattern: z.string().optional(),
  sleeveType: z.string().optional(),
  neckType: z.string().optional(),
  occasion: z.string().optional(),
  season: z.string().optional(),
  careInstructions: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  material: z.string().optional(),
  weight: optionalNumber,
  dimensions: z.object({
    length: optionalNumber,
    width: optionalNumber,
    height: optionalNumber,
  }).optional(),
  tags: z.array(z.string()).optional(),
  searchKeywords: z.array(z.string()).optional(),
  aiAttributes: z.object({
    style: z.string().optional(),
    bodyFit: z.string().optional(),
    recommendedBodyTypes: z.array(z.string()).optional(),
    recommendedFaceShapes: z.array(z.string()).optional(),
  }).optional(),
  visibility: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN', 'OUT_OF_STOCK']),
  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isLimitedEdition: z.boolean().optional(),
}).superRefine((data, ctx) => {
  const mrp = data.mrp ?? 0;
  const sellingPrice = data.sellingPrice ?? 0;

  if (data.sellingPrice != null && data.mrp != null && sellingPrice > mrp && mrp > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selling price cannot exceed MRP',
      path: ['sellingPrice'],
    });
  }

  if (data.visibility === 'PUBLISHED') {
    if (!data.images.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one product image is required',
        path: ['images'],
      });
    }

    if (data.mrp == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MRP is required',
        path: ['mrp'],
      });
    }

    if (data.sellingPrice == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selling price is required',
        path: ['sellingPrice'],
      });
    }

    if (data.variants?.length) {
      data.variants.forEach((variant, index) => {
        if (variant.stock == null || Number.isNaN(variant.stock)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Stock is required for each variant',
            path: ['variants', index, 'stock'],
          });
        }
      });
    }
  }
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const defaultProductFormValues: ProductFormValues = {
  name: '',
  brand: '',
  description: '',
  category: '',
  productType: '',
  gender: '',
  mrp: undefined,
  sellingPrice: undefined,
  discountPercent: undefined,
  taxPercent: undefined,
  stockQuantity: undefined,
  sku: '',
  barcode: '',
  images: [],
  variants: [],
  fabric: '',
  fit: '',
  pattern: '',
  sleeveType: '',
  neckType: '',
  occasion: '',
  season: '',
  careInstructions: '',
  countryOfOrigin: '',
  material: '',
  weight: undefined,
  dimensions: undefined,
  tags: [],
  searchKeywords: [],
  aiAttributes: {
    style: '',
    bodyFit: '',
    recommendedBodyTypes: [],
    recommendedFaceShapes: [],
  },
  visibility: 'DRAFT',
  isFeatured: false,
  isTrending: false,
  isNewArrival: false,
  isBestSeller: false,
  isLimitedEdition: false,
};

export function computeDiscountPercent(mrp?: number, sellingPrice?: number) {
  if (mrp == null || sellingPrice == null || mrp <= 0) {
    return undefined;
  }

  const discount = ((mrp - sellingPrice) / mrp) * 100;
  return Math.max(0, Math.round(discount * 100) / 100);
}
