import { EVENT_OCCASION_KEYWORDS, SEASON_TAGS } from '../types';

const MONSOON_MONTHS = [6, 7, 8, 9];

export function resolveSeasonFromDate(date = new Date()) {
  const month = date.getMonth() + 1;

  if (MONSOON_MONTHS.includes(month)) {
    return 'monsoon';
  }

  if (month >= 3 && month <= 5) {
    return 'spring';
  }

  if (month >= 10 && month <= 11) {
    return 'autumn';
  }

  if (month === 12 || month <= 2) {
    return 'winter';
  }

  return 'summer';
}

export function buildSeasonalContext(date = new Date()) {
  const season = resolveSeasonFromDate(date);

  return {
    season,
    tags: SEASON_TAGS[season] || [],
    month: date.getMonth() + 1,
  };
}

export function scoreSeasonalMatch(product, seasonalContext) {
  if (!seasonalContext?.tags?.length) {
    return { score: 0, matched: false, hits: [] };
  }

  const haystack = [
    ...(product.style_tags || []),
    ...(product.occasion_tags || []),
    product.subcategory || '',
    product.fabric || '',
    product.color || '',
    product.name || '',
  ]
    .join(' ')
    .toLowerCase();

  const hits = seasonalContext.tags.filter((tag) => haystack.includes(tag));

  if (!hits.length) {
    return { score: 0, matched: false, hits: [] };
  }

  return {
    score: Math.min(24, hits.length * 8),
    matched: true,
    hits,
  };
}

export function scoreEventMatch(product, eventType = 'casual') {
  const eventKey = String(eventType || 'casual').toLowerCase();
  const keywords = EVENT_OCCASION_KEYWORDS[eventKey] || EVENT_OCCASION_KEYWORDS.casual;
  const haystack = [
    ...(product.occasion_tags || []),
    ...(product.style_tags || []),
    product.name || '',
    product.subcategory || '',
    product.category || '',
  ].join(' ').toLowerCase();

  const hits = keywords.filter((keyword) => haystack.includes(keyword));

  if (!hits.length) {
    return { score: 0, matched: false, hits: [] };
  }

  return {
    score: Math.min(30, hits.length * 10),
    matched: true,
    hits,
  };
}
