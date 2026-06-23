export function normalizeProductQuery(query = {}) {
  const normalized = { ...query };

  if (normalized.minPrice !== undefined && normalized.min_price === undefined) {
    normalized.min_price = normalized.minPrice;
  }

  if (normalized.maxPrice !== undefined && normalized.max_price === undefined) {
    normalized.max_price = normalized.maxPrice;
  }

  if (normalized.q !== undefined && normalized.search === undefined) {
    normalized.search = normalized.q;
  }

  return normalized;
}
