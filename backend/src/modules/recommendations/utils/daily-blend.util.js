const DAILY_MIX = {
  personalization: 0.4,
  behavior: 0.3,
  trending: 0.2,
  exploration: 0.1,
};

function pickUnique(items, count, usedIds) {
  const picked = [];

  for (const item of items) {
    if (picked.length >= count) {
      break;
    }

    const id = item.product?.id;
    if (!id || usedIds.has(id)) {
      continue;
    }

    usedIds.add(id);
    picked.push(item);
  }

  return picked;
}

function sortByComponent(items, key) {
  return [...items].sort(
    (left, right) => (right.scoreBreakdown?.[key] || 0) - (left.scoreBreakdown?.[key] || 0),
  );
}

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function blendDailyRecommendations(scoredItems = [], limit = 10) {
  if (!scoredItems.length) {
    return [];
  }

  const usedIds = new Set();
  const personalizationPool = sortByComponent(scoredItems, 'personalizationScore');
  const behaviorPool = sortByComponent(scoredItems, 'behaviorScore');
  const trendingPool = sortByComponent(scoredItems, 'trendScore');
  const explorationPool = shuffle(scoredItems);

  const slots = {
    personalization: Math.max(1, Math.round(limit * DAILY_MIX.personalization)),
    behavior: Math.max(1, Math.round(limit * DAILY_MIX.behavior)),
    trending: Math.max(1, Math.round(limit * DAILY_MIX.trending)),
    exploration: Math.max(0, limit - Math.round(limit * 0.9)),
  };

  const blended = [
    ...pickUnique(personalizationPool, slots.personalization, usedIds),
    ...pickUnique(behaviorPool, slots.behavior, usedIds),
    ...pickUnique(trendingPool, slots.trending, usedIds),
    ...pickUnique(explorationPool, slots.exploration, usedIds),
  ];

  if (blended.length < limit) {
    blended.push(
      ...pickUnique(
        sortByComponent(scoredItems, 'score'),
        limit - blended.length,
        usedIds,
      ),
    );
  }

  return blended.slice(0, limit);
}
