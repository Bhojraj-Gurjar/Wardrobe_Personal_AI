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

export function prependVirtualTryOnResult(existing, result) {
  if (!result?.id) {
    return existing;
  }

  if (Array.isArray(existing)) {
    return [result, ...existing.filter((item) => item?.id !== result.id)];
  }

  const items = Array.isArray(existing?.items)
    ? existing.items
    : Array.isArray(existing?.results)
      ? existing.results
      : [];

  const nextItems = [result, ...items.filter((item) => item?.id !== result.id)];

  return {
    ...existing,
    items: nextItems,
    results: nextItems,
  };
}
