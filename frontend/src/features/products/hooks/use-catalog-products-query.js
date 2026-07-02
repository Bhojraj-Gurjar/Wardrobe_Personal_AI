'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { PRODUCTS_CATALOG_FETCH_LIMIT } from '@/features/products/constants/catalog-pagination';
import { fetchProducts } from '@/features/products/services';
import { asArray } from '@/features/products/utils/product-catalog.utils';

const MAX_PAGES_TO_FETCH = 10;

async function fetchAllCatalogProducts(params) {
  const fetchLimit = Math.min(
    Math.max(Number(params.limit) || PRODUCTS_CATALOG_FETCH_LIMIT, 1),
    PRODUCTS_CATALOG_FETCH_LIMIT,
  );

  const firstPage = await fetchProducts({
    ...params,
    page: 1,
    limit: fetchLimit,
  });

  const total = Number(firstPage?.total ?? asArray(firstPage?.items).length);
  const mergedItems = [...asArray(firstPage?.items)];

  if (mergedItems.length >= total) {
    return {
      items: mergedItems.slice(0, total),
      total,
      page: 1,
      limit: fetchLimit,
    };
  }

  let page = 2;

  while (mergedItems.length < total && page <= MAX_PAGES_TO_FETCH) {
    const nextPage = await fetchProducts({
      ...params,
      page,
      limit: fetchLimit,
    });

    const nextItems = asArray(nextPage?.items);

    if (!nextItems.length) {
      break;
    }

    mergedItems.push(...nextItems);
    page += 1;
  }

  return {
    items: mergedItems.slice(0, total),
    total,
    page: 1,
    limit: fetchLimit,
  };
}

/**
 * Loads the full product catalog for the current server-side filters so
 * client-side sort/category pagination always fills pages correctly.
 */
export function useCatalogProductsQuery(params = {}) {
  const { page: _page, limit: _limit, ...catalogParams } = params;

  return useQuery({
    queryKey: ['products', 'catalog', catalogParams],
    queryFn: () => fetchAllCatalogProducts(catalogParams),
    staleTime: QUERY_STALE_TIME.SHORT,
    refetchOnWindowFocus: true,
  });
}
