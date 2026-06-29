const EXTRACTED_TRAIT_KEYS = [
  'bodyType',
  'bodyShape',
  'height',
  'shoulderWidth',
  'chest',
  'waist',
  'hip',
  'armLength',
  'legLength',
  'fitProfile',
];

const DTO_TO_COLUMN = {
  bodyType: 'body_type',
  bodyShape: 'body_shape',
  height: 'height',
  shoulderWidth: 'shoulder_width',
  chest: 'chest',
  waist: 'waist',
  hip: 'hip',
  armLength: 'arm_length',
  legLength: 'leg_length',
  fitProfile: 'fit_profile',
};

export function mapAiResponseToPersistence(aiResponse) {
  if (!aiResponse || typeof aiResponse !== 'object') {
    return {
      body_type: null,
      body_shape: null,
      height: null,
      shoulder_width: null,
      chest: null,
      waist: null,
      hip: null,
      arm_length: null,
      leg_length: null,
      fit_profile: null,
      raw_ai_response: aiResponse ?? null,
    };
  }

  return {
    body_type: aiResponse.bodyType ?? null,
    body_shape: aiResponse.bodyShape ?? null,
    height: aiResponse.height ?? null,
    shoulder_width: aiResponse.shoulderWidth ?? null,
    chest: aiResponse.chest ?? null,
    waist: aiResponse.waist ?? null,
    hip: aiResponse.hip ?? null,
    arm_length: aiResponse.armLength ?? null,
    leg_length: aiResponse.legLength ?? null,
    fit_profile: aiResponse.fitProfile ?? null,
    raw_ai_response: aiResponse,
  };
}

export function mapUpdateDtoToPersistence(dto) {
  const data = {};

  for (const [dtoKey, column] of Object.entries(DTO_TO_COLUMN)) {
    if (dto[dtoKey] !== undefined) {
      data[column] = dto[dtoKey];
    }
  }

  return data;
}

function isDefaultArtifact(raw) {
  return Boolean(
    raw
    && typeof raw === 'object'
    && !Array.isArray(raw)
    && raw.isDefault === true,
  );
}

export function isDefaultBodyAnalysisRecord(record) {
  return isDefaultArtifact(record?.raw_ai_response);
}

export function hasRealBodyAnalysis(record) {
  return resolveBodyHasAnalysis(record);
}

export function resolveBodyHasAnalysis(record) {
  if (!record?.body_type) {
    return false;
  }

  return !isDefaultArtifact(record.raw_ai_response);
}

function resolveBodyConfidence(raw) {
  if (raw?.overallConfidence != null) {
    return raw.overallConfidence;
  }

  const values = [
    raw?.bodyTypeConfidence,
    raw?.bodyShapeConfidence,
  ].filter((value) => value != null);

  if (!values.length) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function mergeManualUpdateIntoRaw(rawAiResponse, dto) {
  const raw =
    rawAiResponse && typeof rawAiResponse === 'object' && !Array.isArray(rawAiResponse)
      ? { ...rawAiResponse }
      : {};

  for (const key of EXTRACTED_TRAIT_KEYS) {
    if (dto[key] !== undefined) {
      raw[key] = dto[key];
    }
  }

  return raw;
}

export function formatBodyAnalysisRecord(record) {
  const raw = record.raw_ai_response || {};
  const measurements = raw.measurements || null;
  const hasAnalysis = resolveBodyHasAnalysis(record);

  return {
    id: record.id,
    userId: record.user_id,
    hasAnalysis,
    bodyType: record.body_type,
    bodyShape: record.body_shape,
    bodyShapeConfidence: raw.bodyShapeConfidence ?? null,
    bodyShapeRatios: raw.bodyShapeRatios ?? null,
    bodyShapeWidths: raw.bodyShapeWidths ?? null,
    bodyTypeConfidence: raw.bodyTypeConfidence ?? null,
    bodyTypeRatios: raw.bodyTypeRatios ?? null,
    height: record.height,
    shoulderWidth: record.shoulder_width,
    chest: record.chest,
    waist: record.waist,
    hip: record.hip,
    armLength: record.arm_length,
    legLength: record.leg_length,
    fitProfile: record.fit_profile,
    sizeRecommendations: raw.sizeRecommendations ?? null,
    proportionScores: raw.proportionScores ?? null,
    measurements,
    analysisMode: raw.analysisMode ?? null,
    framesExtracted: raw.framesExtracted ?? null,
    framesAnalyzed: raw.framesAnalyzed ?? null,
    framesUsed: raw.framesUsed ?? null,
    overallConfidence: raw.overallConfidence ?? null,
    confidence: hasAnalysis ? resolveBodyConfidence(raw) : null,
    analyzedAt: hasAnalysis ? record.updated_at : null,
    rawAiResponse: record.raw_ai_response,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function mapRecordToStoredTraits(record) {
  return {
    body_type: record.body_type,
    body_shape: record.body_shape,
    height: record.height,
    shoulder_width: record.shoulder_width,
    chest: record.chest,
    waist: record.waist,
    hip: record.hip,
    arm_length: record.arm_length,
    leg_length: record.leg_length,
    fit_profile: record.fit_profile,
    visual_analysis_at: record.updated_at,
  };
}
