export {
  resolveProductBrand,
  resolveProductCategory,
  topAffinityKeys,
} from './recommendation-scoring.util';
export {
  rankScoredProducts,
  dedupeProductsById,
  blendCandidatePools,
} from './recommendation-ranking.util';
export {
  resolveSeasonFromDate,
  buildSeasonalContext,
  scoreSeasonalMatch,
} from './seasonal-context.util';
export {
  resolveRecommendationReason,
  buildRecommendationRecords,
  buildScoreExplanations,
  resolvePrimaryExplanation,
} from './recommendation-reason.util';
export {
  computeFaceScore,
  resolveFaceTraits,
  resolveFaceScoreReason,
  buildFaceProductHaystack,
  FACE_SCORE_RAW_MAX,
} from './face-score.util';
export {
  computeBodyScore,
  resolveBodyTraits,
  resolveBodyScoreReason,
  resolveMeasurements,
  detectBroadShoulders,
  buildBodyProductHaystack,
  BODY_SCORE_RAW_MAX,
} from './body-score.util';
export {
  computeSkinToneScore,
  resolveSkinTone,
  resolveSkinUndertone,
  resolveSkinToneScoreReason,
  buildSkinToneProductHaystack,
  WARM_PRODUCT_COLORS,
  COOL_PRODUCT_COLORS,
  SKIN_TONE_SCORE_RAW_MAX,
} from './skin-tone-score.util';
