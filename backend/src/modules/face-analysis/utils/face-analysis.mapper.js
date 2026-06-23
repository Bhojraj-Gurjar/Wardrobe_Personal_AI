const EXTRACTED_TRAIT_KEYS = [
  'faceShape',
  'skinTone',
  'hairLength',
  'hairColor',
  'hairStyle',
  'beardType',
];

const DTO_TO_COLUMN = {
  faceShape: 'face_shape',
  skinTone: 'skin_tone',
  hairLength: 'hair_length',
  hairColor: 'hair_color',
  hairStyle: 'hair_style',
  beardType: 'beard_type',
};

export function mapAiResponseToPersistence(aiResponse) {
  if (!aiResponse || typeof aiResponse !== 'object') {
    return {
      face_shape: null,
      skin_tone: null,
      hair_length: null,
      hair_color: null,
      hair_style: null,
      beard_type: null,
      raw_ai_response: aiResponse ?? null,
    };
  }

  return {
    face_shape: aiResponse.faceShape ?? null,
    skin_tone: aiResponse.skinTone ?? null,
    hair_length: aiResponse.hairLength ?? null,
    hair_color: aiResponse.hairColor ?? null,
    hair_style: aiResponse.hairStyle ?? null,
    beard_type: aiResponse.beardType ?? null,
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

export function formatFaceAnalysisRecord(record) {
  const raw = record.raw_ai_response || {};

  return {
    id: record.id,
    userId: record.user_id,
    faceShape: record.face_shape,
    faceShapeConfidence: raw.faceShapeConfidence ?? null,
    faceShapeMetrics: raw.faceShapeMetrics ?? null,
    skinTone: record.skin_tone,
    skinToneConfidence: raw.skinToneConfidence ?? null,
    skinToneMetrics: raw.skinToneMetrics ?? null,
    hairLength: record.hair_length,
    hairLengthConfidence: raw.hairLengthConfidence ?? null,
    hairColor: record.hair_color,
    hairColorConfidence: raw.hairColorConfidence ?? null,
    hairStyle: record.hair_style,
    hairStyleConfidence: raw.hairStyleConfidence ?? null,
    hairMetrics: raw.hairMetrics ?? null,
    beardType: record.beard_type,
    beardTypeConfidence: raw.beardTypeConfidence ?? null,
    beardMetrics: raw.beardMetrics ?? null,
    rawAiResponse: record.raw_ai_response,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function mapRecordToStoredTraits(record) {
  return {
    face_shape: record.face_shape,
    skin_tone: record.skin_tone,
    hair_length: record.hair_length,
    hair_color: record.hair_color,
    hair_style: record.hair_style,
    beard_type: record.beard_type,
    visual_analysis_at: record.updated_at,
  };
}
