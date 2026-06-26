import {
  OCCASION_ACCESSORIES,
  OCCASION_COLORS,
  OCCASION_KEYWORDS,
} from '../constants/stylist.constants';
import { STYLIST_INTENTS } from '../constants/stylist-intents.constants';

const GREETING_PATTERN = /^(hi|hello|hey|hiya|howdy|good morning|good afternoon|good evening|sup|yo|what's up|whats up|greetings)[!.?\s]*$/i;
const BUDGET_PATTERN = /(?:under|below|within|budget|max|less than|upto|up to|₹|rs\.?\s*|inr\s*)([\d,]+)/gi;
const EXPLICIT_BUDGET = /₹\s*([\d,]+)/g;

const CATEGORY_KEYWORDS = {
  shirts: ['shirt', 'shirts', 'oxford', 'formal shirt'],
  tshirts: ['t-shirt', 'tshirt', 'tee', 'tees'],
  shoes: ['shoe', 'shoes', 'sneaker', 'sneakers', 'footwear', 'boots', 'loafers'],
  jackets: ['jacket', 'jackets', 'blazer', 'coat', 'outerwear'],
  pants: ['pant', 'pants', 'jeans', 'trousers', 'chinos', 'bottoms'],
};

const SEASON_KEYWORDS = {
  summer: ['summer', 'hot weather', 'warm weather'],
  winter: ['winter', 'cold weather', 'layering season'],
  monsoon: ['monsoon', 'rainy', 'rain'],
};

const FOLLOW_UP_PATTERN = /^(make it|use|switch to|change to|cheaper|more formal|more casual|instead|add|remove|less|more)\b/i;

export function parseStylistIntent(message, history = []) {
  const text = `${message || ''}`.toLowerCase().trim();
  const rawMessage = message || '';

  if (GREETING_PATTERN.test(text)) {
    return buildIntent(STYLIST_INTENTS.GREETING, { rawMessage });
  }

  const previousAssistant = findLastAssistantMessage(history);
  if (previousAssistant && isFollowUp(text)) {
    return buildIntent(STYLIST_INTENTS.FOLLOW_UP_MODIFY, {
      rawMessage,
      modifier: detectModifier(text),
      previousProducts: previousAssistant.metadata?.products || [],
      previousIntent: previousAssistant.metadata?.intent || null,
      previousSections: previousAssistant.metadata?.sections || null,
    });
  }

  if (/face shape|suits my face|face suit|jawline|neckline.*face|for my face/i.test(rawMessage)) {
    return buildIntent(STYLIST_INTENTS.FACE_STYLE_GUIDANCE, { rawMessage });
  }

  if (/body shape|body type|fits my body|for my body|broad shoulder|my build|body fit/i.test(rawMessage)) {
    return buildIntent(STYLIST_INTENTS.BODY_STYLE_GUIDANCE, { rawMessage });
  }

  if (/color|colour|palette|skin tone|what colors|which colors|color suit|colours suit/i.test(rawMessage)) {
    return buildIntent(STYLIST_INTENTS.COLOR_ADVICE, { rawMessage });
  }

  const season = detectSeason(text);
  if (season) {
    return buildIntent(STYLIST_INTENTS.SEASONAL_STYLING, {
      rawMessage,
      season,
    });
  }

  if (/closet|wardrobe|already own|my purchases|what i bought|personal closet/i.test(rawMessage)) {
    return buildIntent(STYLIST_INTENTS.CLOSET_ADVICE, { rawMessage });
  }

  const category = detectCategory(text);
  if (category === 'shoes' || /recommend shoes|suggest shoes|footwear only|shoe recommendation/i.test(rawMessage)) {
    return buildIntent(STYLIST_INTENTS.FOOTWEAR_RECOMMENDATION, {
      rawMessage,
      category: 'shoes',
    });
  }

  if (category && /recommend|suggest|show|find|best/i.test(rawMessage)) {
    return buildIntent(STYLIST_INTENTS.CATEGORY_REQUEST, {
      rawMessage,
      category,
    });
  }

  const maxBudget = extractBudget(text);
  if (maxBudget || /budget|affordable|cheap|economical|under ₹|under rs/i.test(rawMessage)) {
    const occasion = detectOccasion(text);
    return buildIntent(STYLIST_INTENTS.BUDGET_STYLING, {
      rawMessage,
      maxBudget,
      occasion,
    });
  }

  const occasion = detectOccasion(text);
  if (occasion) {
    return buildIntent(STYLIST_INTENTS.OCCASION_STYLING, {
      rawMessage,
      occasion,
    });
  }

  if (/accessor|watch|belt|bag|jewel|cufflink|tie\b/i.test(rawMessage)) {
    return buildIntent(STYLIST_INTENTS.ACCESSORY_ADVICE, {
      rawMessage,
      occasion,
    });
  }

  if (/outfit|wear|dress|look|attire|style me|create|build|put together|what should i wear/i.test(rawMessage)) {
    return buildIntent(STYLIST_INTENTS.OUTFIT_GENERATION, {
      rawMessage,
      occasion,
    });
  }

  return buildIntent(STYLIST_INTENTS.GENERAL_ADVICE, { rawMessage, occasion });
}

function buildIntent(type, extras = {}) {
  const occasion = extras.occasion || null;
  return {
    type,
    occasion,
    maxBudget: extras.maxBudget ?? null,
    category: extras.category ?? null,
    season: extras.season ?? null,
    modifier: extras.modifier ?? null,
    previousProducts: extras.previousProducts ?? [],
    previousIntent: extras.previousIntent ?? null,
    previousSections: extras.previousSections ?? null,
    wantsColors: type === STYLIST_INTENTS.COLOR_ADVICE,
    wantsAccessories: type === STYLIST_INTENTS.ACCESSORY_ADVICE
      || ['interview', 'wedding', 'formal', 'party'].includes(occasion),
    wantsOutfit: [
      STYLIST_INTENTS.OUTFIT_GENERATION,
      STYLIST_INTENTS.OCCASION_STYLING,
      STYLIST_INTENTS.BUDGET_STYLING,
      STYLIST_INTENTS.FOLLOW_UP_MODIFY,
    ].includes(type),
    wantsBudgetTips: type === STYLIST_INTENTS.BUDGET_STYLING || Boolean(extras.maxBudget),
    rawMessage: extras.rawMessage || '',
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

function detectSeason(text) {
  for (const [season, keywords] of Object.entries(SEASON_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return season;
    }
  }
  return null;
}

function detectCategory(text) {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
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

  return values.length ? Math.max(...values) : null;
}

function isFollowUp(text) {
  return FOLLOW_UP_PATTERN.test(text)
    || /instead$/i.test(text)
    || /^use (black|white|navy|blue|grey|gray|brown|beige|olive)\b/i.test(text);
}

function detectModifier(text) {
  if (/cheaper|lower budget|less expensive|budget/i.test(text)) {
    return 'cheaper';
  }
  if (/formal|dressy|smart/i.test(text)) {
    return 'formal';
  }
  if (/casual|relaxed/i.test(text)) {
    return 'casual';
  }
  const colorMatch = text.match(/\b(black|white|navy|blue|grey|gray|brown|beige|olive|maroon|burgundy)\b/i);
  if (colorMatch) {
    return { color: colorMatch[1].toLowerCase() };
  }
  if (/add accessor|add shoes|add footwear/i.test(text)) {
    return 'add_accessories';
  }
  return 'general';
}

function findLastAssistantMessage(history = []) {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index]?.role === 'assistant') {
      return history[index];
    }
  }
  return null;
}

export function resolveColorSuggestions(intent, context) {
  const dnaColors = context?.signals?.favoriteColors || [];
  const skinTone = context?.factors?.skin_tone;
  const faceAnalysis = context?.faceAnalysis;
  const occasionColors = intent.occasion
    ? OCCASION_COLORS[intent.occasion] || []
    : [];

  const faceColors = faceAnalysis?.raw_ai_response?.styleInsights?.sections
    ?.find((section) => section.id === 'colors')
    ?.items?.[0]?.recommendation;

  const facePalette = faceColors
    ? String(faceColors).split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  const palette = [...new Set([
    ...facePalette.slice(0, 4),
    ...dnaColors.slice(0, 3),
    ...occasionColors,
  ])];

  if (!palette.length) {
    if (/deep|dark|brown|wheatish|tan|olive/i.test(`${skinTone}`)) {
      return ['Emerald', 'Burgundy', 'Deep navy', 'Warm gold', 'Earth tones'];
    }
    if (/warm|golden|medium/i.test(`${skinTone}`)) {
      return ['Olive', 'Camel', 'Terracotta', 'Warm white', 'Navy'];
    }
    if (/cool|fair|light/i.test(`${skinTone}`)) {
      return ['Navy', 'Charcoal', 'Powder blue', 'Soft mauve', 'White'];
    }
    return ['Navy', 'White', 'Charcoal', 'Earth tones', 'Muted jewel tones'];
  }

  return palette.slice(0, 6);
}

export function resolveAccessorySuggestions(intent) {
  if (intent.occasion && OCCASION_ACCESSORIES[intent.occasion]) {
    return OCCASION_ACCESSORIES[intent.occasion];
  }
  return ['Classic watch', 'Leather belt', 'Versatile sneakers'];
}
