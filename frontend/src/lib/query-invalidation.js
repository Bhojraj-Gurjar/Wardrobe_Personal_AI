/**
 * Invalidate one or more React Query keys and optionally refetch active observers.
 */
export async function invalidateQueryKeys(queryClient, keys, { refetchType = 'active' } = {}) {
  const uniqueKeys = Array.isArray(keys) ? keys : [keys];

  await Promise.all(
    uniqueKeys.map((queryKey) =>
      queryClient.invalidateQueries({
        queryKey,
        refetchType,
      }),
    ),
  );
}

import { normalizeTryOnHistoryResult } from '@/features/virtual-try-on/utils/try-on-image.util';

export function prependVirtualTryOnResult(existing, result) {
  const normalized = normalizeTryOnHistoryResult(result);

  if (!normalized?.id) {
    return existing;
  }

  if (Array.isArray(existing)) {
    return [normalized, ...existing.filter((item) => item?.id !== normalized.id)];
  }

  const items = Array.isArray(existing?.items)
    ? existing.items
    : Array.isArray(existing?.results)
      ? existing.results
      : [];

  const nextItems = [normalized, ...items.filter((item) => item?.id !== normalized.id)];

  return {
    ...existing,
    items: nextItems,
    results: nextItems,
  };
}
