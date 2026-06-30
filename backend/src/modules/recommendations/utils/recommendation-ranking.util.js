export function rankScoredProducts(scoredItems = [], limit = 10) {
  return [...scoredItems]
    .sort((left, right) => {
      const scoreDelta = (right.score || 0) - (left.score || 0);

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return String(left.product?.id || '').localeCompare(String(right.product?.id || ''));
    })
    .slice(0, limit);
}

export function dedupeProductsById(items = []) {
  const seen = new Set();

  return items.filter((item) => {
    const id = item.product?.id;

    if (!id || seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

export function blendCandidatePools(...pools) {
  const merged = new Map();

  pools.flat().forEach((item) => {
    const id = item.product?.id;

    if (!id) {
      return;
    }

    const existing = merged.get(id);

    if (!existing || (item.score || 0) > (existing.score || 0)) {
      merged.set(id, item);
    }
  });

  return [...merged.values()];
}
