import { buildDeterministicFashionDnaVector } from '../../fashion-dna/utils/fashion-dna-embedding.util';

const TRAIT_FIELDS = [
  ['faceShape', 'face_shape'],
  ['skinTone', 'skin_tone'],
  ['hairLength', 'hair_length'],
  ['hairColor', 'hair_color'],
  ['hairStyle', 'hair_style'],
  ['beardType', 'beard_type'],
];

function normalizeTrait(value) {
  return String(value || 'unknown')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function resolveTrait(record, camelKey, snakeKey) {
  return record[camelKey] ?? record[snakeKey] ?? null;
}

export function buildFaceAnalysisEmbeddingText(record) {
  const parts = TRAIT_FIELDS.map(([camelKey, snakeKey]) => {
    const label = snakeKey.replace(/_/g, ' ');
    const value = normalizeTrait(resolveTrait(record, camelKey, snakeKey));
    return `${label} ${value}`;
  });

  return parts.join(' ').trim();
}

export function buildDeterministicFaceAnalysisVector(text, targetSize = 384) {
  return buildDeterministicFashionDnaVector(text, targetSize);
}
