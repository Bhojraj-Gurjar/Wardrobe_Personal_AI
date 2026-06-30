import { normalizeAvatarType } from './avatar-type.util';

export function formatDigitalAvatarRecord(record, resolvePublicUrl) {
  const metadata = record.raw_ai_response?.metadata ?? null;
  const rawAiResponse = record.raw_ai_response ?? null;
  const avatarImagePath = record.avatar_image;
  const avatarType = normalizeAvatarType(record.avatar_type);

  return {
    id: record.id,
    userId: record.user_id,
    avatarType,
    avatarImagePath,
    avatarImage: resolvePublicUrl
      ? resolvePublicUrl(avatarImagePath)
      : avatarImagePath,
    version: record.version,
    isActive: record.is_active,
    metadata,
    gender: metadata?.gender ?? null,
    age: metadata?.age ?? null,
    bodyType: metadata?.bodyType ?? null,
    skinTone: metadata?.skinTone ?? metadata?.faceAnalysis?.skinTone ?? null,
    faceAnalysis: metadata?.faceAnalysis ?? null,
    hairAnalysis: metadata?.hairAnalysis ?? null,
    beardAnalysis: metadata?.beardAnalysis ?? null,
    bodyAnalysis: metadata?.bodyAnalysis ?? null,
    traitFingerprint: metadata?.traitFingerprint ?? null,
    quality: metadata?.quality ?? null,
    confidence: rawAiResponse?.confidence ?? metadata?.confidence ?? null,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function formatDigitalAvatarHistoryEntry(record, resolvePublicUrl) {
  const avatarImagePath = record.avatar_image;
  const avatarType = normalizeAvatarType(record.avatar_type);

  return {
    version: record.version,
    type: avatarType,
    avatarType,
    avatarImagePath,
    avatarImage: resolvePublicUrl
      ? resolvePublicUrl(avatarImagePath)
      : avatarImagePath,
    createdAt: record.created_at,
    id: record.id,
    isActive: record.is_active,
  };
}

export function formatDigitalAvatarHistoryList(records, resolvePublicUrl) {
  return [...records]
    .sort((left, right) => left.version - right.version)
    .map((record) => formatDigitalAvatarHistoryEntry(record, resolvePublicUrl));
}

export function formatDigitalAvatarHistory(records, resolvePublicUrl) {
  return formatDigitalAvatarHistoryList(records, resolvePublicUrl);
}
