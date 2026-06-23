import crypto from 'crypto';

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function sortedAffinityTerms(affinity) {
  if (!affinity || typeof affinity !== 'object') {
    return '';
  }

  return Object.entries(affinity)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, weight]) => `${key}:${Number(weight).toFixed(3)}`)
    .join(' ');
}

export function buildFashionDnaEmbeddingText(record) {
  const preferenceTraits = record.preferenceTraits || record.preference_traits || {};
  const activityTraits = record.activityTraits || record.activity_traits || {};
  const colorAffinity = record.colorAffinity || record.color_affinity || {};
  const brandAffinity = record.brandAffinity || record.brand_affinity || {};
  const categoryAffinity =
    preferenceTraits.category_affinity || record.categoryAffinity || {};

  const styleType = record.styleType || record.style_type || 'general';
  const personality =
    record.fashionPersonality
    || preferenceTraits.fashion_personality
    || activityTraits.fashionPersonality
    || styleType;

  return [
    `style ${styleType}`,
    `personality ${personality}`,
    `categories ${sortedAffinityTerms(categoryAffinity)}`,
    `colors ${sortedAffinityTerms(colorAffinity)}`,
    `brands ${sortedAffinityTerms(brandAffinity)}`,
  ]
    .join(' ')
    .trim();
}

export function buildDeterministicFashionDnaVector(text, targetSize = 384) {
  const digest = crypto.createHash('sha256').update(text).digest();
  const seed = digest.readUInt32BE(0);
  const vector = new Array(targetSize).fill(0);

  for (let index = 0; index < targetSize; index += 1) {
    const hash = Math.abs(((seed + index) * 9301 + 49297) % 233280);
    vector[index] = (hash / 233280) * 2 - 1;
  }

  const magnitude = Math.sqrt(
    vector.reduce((sum, value) => sum + value * value, 0),
  );

  if (!magnitude) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}
