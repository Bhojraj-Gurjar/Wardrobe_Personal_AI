export function buildCombinedReason(explanations = [], fallback = 'Recommended for you') {
  const reasons = (explanations || [])
    .map((entry) => entry?.reason)
    .filter(Boolean)
    .slice(0, 2);

  if (!reasons.length) {
    return fallback;
  }

  if (reasons.length === 1) {
    return reasons[0];
  }

  const first = reasons[0].replace(/\.$/, '');
  const second = reasons[1].replace(/\.$/, '').toLowerCase();
  return `${first} and ${second}`;
}

export function deriveRecommendationBadges(item = {}, meta = {}) {
  const badges = [];
  const score = Number(item.score) || 0;

  if (score >= 90) {
    badges.push({ label: `${Math.round(score)}% Match`, variant: 'match' });
  } else if (score >= 75) {
    badges.push({ label: 'Recommended For You', variant: 'recommended' });
  }

  if (item.matched_factors?.includes('trending') || item.scoreBreakdown?.trendScore > 8) {
    badges.push({ label: 'Trending', variant: 'trending' });
  }

  if (item.matched_factors?.includes('budget') || item.scoreBreakdown?.budgetScore >= 12) {
    badges.push({ label: 'Budget Friendly', variant: 'budget' });
  }

  if (meta.editorPickProductIds?.includes(item.product?.id)) {
    badges.push({ label: "Editor's Pick", variant: 'editor' });
  }

  return badges;
}
