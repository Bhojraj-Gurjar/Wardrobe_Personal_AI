export function coerceTryOnHistoryResults(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

export function coerceResultIdMap(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  return {};
}

export function logVirtualTryOnError(scope, error, context = {}) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[virtual-try-on:${scope}]`, {
      message: error?.message || String(error),
      stack: error?.stack,
      ...context,
    });
  }
}
