'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { fetchSearchResults } from '../services/global-search.service';

export function useSearchResultsQuery(params = {}, { enabled = true } = {}) {
  const query = String(params.q || params.search || '').trim();

  return useQuery({
    queryKey: ['search-results', params],
    queryFn: ({ signal }) => fetchSearchResults(
      {
        q: query,
        page: params.page || 1,
        limit: params.limit || 12,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        category: params.category,
        brand: params.brand,
        min_price: params.min_price,
        max_price: params.max_price,
        productType: params.productType,
      },
      { signal },
    ),
    enabled: enabled && Boolean(query),
    staleTime: QUERY_STALE_TIME.SHORT,
    placeholderData: (previous) => previous,
  });
}
