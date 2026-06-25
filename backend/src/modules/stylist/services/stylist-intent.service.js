import {
  OCCASION_ACCESSORIES,
  OCCASION_COLORS,
  OCCASION_KEYWORDS,
} from '../constants/stylist.constants';

const BUDGET_PATTERN = /(?:under|below|within|budget|max|less than|upto|up to|₹|rs\.?\s*|inr\s*)([\d,]+)/gi;
const EXPLICIT_BUDGET = /₹\s*([\d,]+)/g;

export function parseStylistIntent(message) {
  const text = `${message || ''}`.toLowerCase().trim();
  const occasion = detectOccasion(text);
  const maxBudget = extractBudget(text);
  const wantsColors = /color|colour|palette|tone|match my skin|skin tone/i.test(message);
  const wantsAccessories = /accessor|watch|belt|shoe|bag|jewel/i.test(message);
  const wantsOutfit = /outfit|wear|dress|look|attire|style me|suggest|recommend|create|build/i.test(message)
    || Boolean(occasion)
    || Boolean(maxBudget);

  return {
    occasion,
    maxBudget,
    wantsColors: wantsColors || wantsOutfit,
    wantsAccessories: wantsAccessories || ['interview', 'wedding', 'formal', 'party'].includes(occasion),
    wantsOutfit,
    wantsBudgetTips: Boolean(maxBudget) || /budget|affordable|cheap|economical|save money/i.test(text),
    rawMessage: message,
  };
}

function detectOccasion(text) {
  for (const [occasion, keywords] of Object.entries(OCCASION_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return occasion;
    }
  }
  return null;
}

function extractBudget(text) {
  const values = [];

  for (const pattern of [BUDGET_PATTERN, EXPLICIT_BUDGET]) {
    let match = pattern.exec(text);
    while (match) {
      const value = Number(String(match[1]).replace(/,/g, ''));
      if (Number.isFinite(value) && value > 0) {
        values.push(value);
      }
      match = pattern.exec(text);
    }
    pattern.lastIndex = 0;
  }

  if (!values.length) {
    return null;
  }

  return Math.max(...values);
}

export function resolveColorSuggestions(intent, context) {
  const dnaColors = context?.signals?.favoriteColors || [];
  const skinTone = context?.factors?.skin_tone;
  const occasionColors = intent.occasion
    ? OCCASION_COLORS[intent.occasion] || []
    : [];

  const palette = [...new Set([...dnaColors.slice(0, 3), ...occasionColors])];

  if (!palette.length) {
    if (/warm|golden|olive/i.test(`${skinTone}`)) {
      return ['Olive', 'Camel', 'Warm white', 'Terracotta', 'Navy'];
    }
    if (/cool|fair|light/i.test(`${skinTone}`)) {
      return ['Navy', 'Charcoal', 'Ice blue', 'Soft pink', 'White'];
    }
    return ['Navy', 'White', 'Charcoal', 'Earth tones', 'Muted pastels'];
  }

  return palette.slice(0, 5);
}

export function resolveAccessorySuggestions(intent) {
  if (intent.occasion && OCCASION_ACCESSORIES[intent.occasion]) {
    return OCCASION_ACCESSORIES[intent.occasion];
  }
  return ['Classic watch', 'Leather belt', 'Versatile sneakers', 'Minimal bag'];
}
