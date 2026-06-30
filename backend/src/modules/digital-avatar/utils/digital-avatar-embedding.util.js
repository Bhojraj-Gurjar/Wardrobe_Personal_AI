import {
  buildDeterministicFashionDnaVector,
  buildFashionDnaEmbeddingText,
} from '../../fashion-dna/utils/fashion-dna-embedding.util';

function normalizeTrait(value) {
  return String(value || 'unknown')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

export function extractFashionDnaSummary(fashionDnaRecord) {
  if (!fashionDnaRecord) {
    return null;
  }

  const styleType = fashionDnaRecord.style_type || fashionDnaRecord.styleType;

  if (styleType) {
    return String(styleType);
  }

  return buildFashionDnaEmbeddingText({
    styleType: fashionDnaRecord.style_type,
    colorAffinity: fashionDnaRecord.color_affinity,
    brandAffinity: fashionDnaRecord.brand_affinity,
    preferenceTraits: fashionDnaRecord.preference_traits,
    activityTraits: fashionDnaRecord.activity_traits,
    fashionPersonality: fashionDnaRecord.preference_traits?.fashion_personality,
  }).slice(0, 256);
}

export function buildDigitalAvatarEmbeddingText({
  avatarType,
  bodyType,
  faceShape,
  skinTone,
  hairStyle,
  fashionDNA,
}) {
  return [
    `avatar type ${normalizeTrait(avatarType)}`,
    `body type ${normalizeTrait(bodyType)}`,
    `face shape ${normalizeTrait(faceShape)}`,
    `skin tone ${normalizeTrait(skinTone)}`,
    `hair style ${normalizeTrait(hairStyle)}`,
    `fashion dna ${normalizeTrait(fashionDNA)}`,
  ]
    .join(' ')
    .trim();
}

export function buildDeterministicDigitalAvatarVector(text, targetSize = 384) {
  return buildDeterministicFashionDnaVector(text, targetSize);
}
