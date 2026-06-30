import { z } from 'zod';

export const PRODUCT_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'name',
  'price',
];

export const SORT_ORDERS = ['asc', 'desc'];

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  q: z.string().optional(),
  sortBy: z.enum(PRODUCT_SORT_FIELDS).default('created_at'),
  sortOrder: z.enum(SORT_ORDERS).default('desc'),
  category: z.string().optional(),
  productType: z.string().optional(),
  product_type: z.string().optional(),
  category_id: z.string().optional(),
  brand: z.string().optional(),
  brand_id: z.string().optional(),
  color: z.string().optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

export function buildProductQueryString(params) {
  const parsed = productQuerySchema.parse(params);
  const searchParams = new URLSearchParams();

  Object.entries(parsed).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
