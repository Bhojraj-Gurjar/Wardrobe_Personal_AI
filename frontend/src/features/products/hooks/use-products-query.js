'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { fetchProducts, fetchProductById } from '@/features/products/services';

export function useProductsQuery(params = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    staleTime: QUERY_STALE_TIME.SHORT,
    refetchOnWindowFocus: true,
  });
}

export function useProductQuery(id) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => fetchProductById(id),
    enabled: Boolean(id),
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });
}
