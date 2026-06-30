import { formatEnumLabel, formatProfileDate } from '@/features/profile/utils/profile-helpers';

function normalizeColorLabel(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    return String(value.name || value.label || value.color || value.key || '');
  }

  return String(value);
}

function normalizeColorLabels(colors) {
  return (colors || [])
    .map(normalizeColorLabel)
    .filter(Boolean);
}

const COMPLETION_WEIGHTS = {
  faceAnalysis: 18,
  bodyAnalysis: 18,
  preferences: 16,
  closetSetup: 16,
  avatarCreated: 16,
  fashionDna: 16,
};

function hasFaceAnalysis(faceData) {
  return Boolean(faceData?.hasAnalysis || faceData?.analyzedAt);
}

function hasBodyAnalysis(bodyData) {
  return Boolean(bodyData?.hasAnalysis || bodyData?.analyzedAt);
}

function hasPreferences(profile) {
  const prefs = profile?.preferences || {};
  const keys = [
    'occupation',
    'budget_preference',
    'preferred_categories',
    'favorite_colors',
    'favorite_brands',
    'preferred_outfit_types',
  ];

  return keys.some((key) => {
    const value = prefs[key];
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  });
}

function hasClosetSetup(closetOverview) {
  if (!closetOverview) return false;
  const total =
    (closetOverview.purchasedItems ?? 0)
    + (closetOverview.savedOutfits ?? 0);
  return total > 0;
}

function hasAvatar(avatar) {
  return Boolean(avatar?.id || avatar?.baseAvatarUrl || avatar?.model3dUrl);
}

function hasFashionDna(fashionDna) {
  return Boolean(fashionDna?.hasData && !fashionDna?.isDefault);
}

export function computeProfileCompletion({
  profile,
  faceAnalysis,
  bodyAnalysis,
  fashionDna,
  closetOverview,
  avatar,
}) {
  const checks = {
    faceAnalysis: hasFaceAnalysis(faceAnalysis),
    bodyAnalysis: hasBodyAnalysis(bodyAnalysis),
    preferences: hasPreferences(profile),
    closetSetup: hasClosetSetup(closetOverview),
    avatarCreated: hasAvatar(avatar),
    fashionDna: hasFashionDna(fashionDna),
  };

  const earned = Object.entries(checks).reduce(
    (sum, [key, done]) => sum + (done ? COMPLETION_WEIGHTS[key] : 0),
    0,
  );

  const items = [
    { id: 'faceAnalysis', label: 'Face Analysis Completed', done: checks.faceAnalysis },
    { id: 'bodyAnalysis', label: 'Body Analysis Completed', done: checks.bodyAnalysis },
    { id: 'preferences', label: 'Preferences Added', done: checks.preferences },
    { id: 'closetSetup', label: 'Closet Setup', done: checks.closetSetup },
    { id: 'avatarCreated', label: 'Avatar Created', done: checks.avatarCreated },
    { id: 'fashionDna', label: 'Fashion DNA Generated', done: checks.fashionDna },
  ];

  return {
    percent: Math.min(100, Math.round(earned)),
    items,
    checks,
  };
}

export function buildFashionIdentity({
  profile,
  faceDashboard,
  bodyDashboard,
  fashionDna,
}) {
  const preferences = profile?.preferences || {};
  const faceShapeRow = faceDashboard?.summaryRows?.find((row) =>
    /face shape/i.test(row.label || ''),
  );
  const faceShape =
    faceShapeRow?.value && faceShapeRow.value !== '—' ? faceShapeRow.value : null;

  const colors = normalizeColorLabels(
    fashionDna?.recommendedColors?.length
      ? fashionDna.recommendedColors
      : (preferences.favorite_colors || []).map(formatEnumLabel),
  );

  const brands =
    fashionDna?.brandPreferences?.length
      ? fashionDna.brandPreferences
      : (preferences.favorite_brands || []);

  const budget =
    fashionDna?.budgetType
    || fashionDna?.budgetRangeLabel
    || (preferences.budget_preference ? formatEnumLabel(preferences.budget_preference) : null);

  const rawBodyType = bodyDashboard?.bodyType;
  const bodyType =
    rawBodyType && rawBodyType !== '—'
      ? formatEnumLabel(rawBodyType)
      : (profile?.body_type ? formatEnumLabel(profile.body_type) : null);

  const stylePersonality =
    fashionDna?.fashionPersonality
    || (fashionDna?.styleType ? formatEnumLabel(fashionDna.styleType) : null);

  return {
    stylePersonality,
    fashionDnaScore: fashionDna?.confidenceScore || null,
    bodyType,
    faceShape,
    colorPalette: colors.slice(0, 5),
    preferredBrands: brands.slice(0, 5),
    budgetProfile: budget,
  };
}

export function buildPersonalizationHealth({
  faceAnalysis,
  bodyAnalysis,
  fashionDna,
  closetOverview,
  profile,
  avatar,
}) {
  const completion = computeProfileCompletion({
    profile,
    faceAnalysis,
    bodyAnalysis,
    fashionDna,
    closetOverview,
    avatar,
  });

  const preferenceFields = [
    profile?.preferences?.occupation,
    profile?.preferences?.budget_preference,
    profile?.preferences?.favorite_colors,
    profile?.preferences?.preferred_categories,
  ].filter(Boolean);

  const preferenceScore = Math.min(
    100,
    Math.round((preferenceFields.length / 4) * 100),
  );

  const closetCount = closetOverview?.purchasedItems ?? 0;
  const closetScore = closetCount >= 10
    ? 100
    : closetCount >= 5
      ? 75
      : closetCount >= 1
        ? 50
        : 0;

  return [
    {
      id: 'face',
      label: 'Face Analysis',
      percent: hasFaceAnalysis(faceAnalysis) ? 100 : 0,
      href: '/face-analysis',
    },
    {
      id: 'body',
      label: 'Body Analysis',
      percent: hasBodyAnalysis(bodyAnalysis) ? 100 : 0,
      href: '/body-analysis',
    },
    {
      id: 'fashionDna',
      label: 'Fashion DNA',
      percent: hasFashionDna(fashionDna) ? 100 : fashionDna?.confidenceScore || 0,
      href: '/fashion-dna',
    },
    {
      id: 'closet',
      label: 'Closet Setup',
      percent: closetScore,
      href: '/my-closet',
    },
    {
      id: 'preferences',
      label: 'Preferences',
      percent: completion.checks.preferences ? Math.max(preferenceScore, 80) : preferenceScore,
    },
    {
      id: 'confidence',
      label: 'Style Confidence',
      percent: fashionDna?.confidenceScore || 0,
      href: '/fashion-dna',
    },
  ];
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pushEvent(events, { id, title, date, icon }) {
  const parsed = parseDate(date);
  if (!parsed) return;
  events.push({ id, title, date: parsed, icon });
}

export function buildFashionJourney({
  profile,
  faceAnalysis,
  bodyAnalysis,
  avatar,
  savedOutfits,
  orders,
  tryOnResults,
}) {
  const events = [];

  pushEvent(events, {
    id: 'joined',
    title: 'Joined Wardrobe AI',
    date: profile?.created_at,
    icon: 'sparkles',
  });

  if (hasFaceAnalysis(faceAnalysis)) {
    pushEvent(events, {
      id: 'face',
      title: 'Completed Face Analysis',
      date: faceAnalysis?.analyzedAt || faceAnalysis?.updated_at,
      icon: 'scan',
    });
  }

  if (hasBodyAnalysis(bodyAnalysis)) {
    pushEvent(events, {
      id: 'body',
      title: 'Completed Body Analysis',
      date: bodyAnalysis?.analyzedAt || bodyAnalysis?.updated_at,
      icon: 'body',
    });
  }

  if (hasAvatar(avatar)) {
    pushEvent(events, {
      id: 'avatar',
      title: 'Created Avatar',
      date: avatar?.createdAt || avatar?.updatedAt,
      icon: 'avatar',
    });
  }

  const outfits = Array.isArray(savedOutfits) ? savedOutfits : savedOutfits?.items || [];
  const firstOutfit = [...outfits]
    .sort((a, b) => parseDate(a.createdAt) - parseDate(b.createdAt))
    .find((item) => parseDate(item.createdAt));

  if (firstOutfit) {
    pushEvent(events, {
      id: 'saved-look',
      title: 'Saved First Outfit',
      date: firstOutfit.createdAt,
      icon: 'outfit',
    });
  }

  const orderItems = Array.isArray(orders) ? orders : orders?.items || [];
  const firstOrder = [...orderItems]
    .sort((a, b) => parseDate(a.created_at || a.createdAt) - parseDate(b.created_at || b.createdAt))
    .find((item) => parseDate(item.created_at || item.createdAt));

  if (firstOrder) {
    pushEvent(events, {
      id: 'order',
      title: 'Placed First Order',
      date: firstOrder.created_at || firstOrder.createdAt,
      icon: 'order',
    });
  }

  const tryOns = Array.isArray(tryOnResults) ? tryOnResults : tryOnResults?.items || [];
  const firstTryOn = [...tryOns]
    .sort((a, b) => parseDate(a.createdAt) - parseDate(b.createdAt))
    .find((item) => parseDate(item.createdAt));

  if (firstTryOn) {
    pushEvent(events, {
      id: 'try-on',
      title: 'Completed First Try-On',
      date: firstTryOn.createdAt,
      icon: 'tryon',
    });
  }

  return events
    .sort((a, b) => a.date - b.date)
    .map((event) => ({
      ...event,
      dateLabel: formatProfileDate(event.date),
    }));
}

export function formatMemberSince(createdAt) {
  if (!createdAt) return null;
  const date = parseDate(createdAt);
  if (!date) return null;

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function buildStylePersonalityLabel(fashionDna, preferences = {}) {
  if (fashionDna?.fashionPersonality) {
    return fashionDna.fashionPersonality;
  }

  if (fashionDna?.styleType) {
    return `${formatEnumLabel(fashionDna.styleType)} Explorer`;
  }

  const inspiration =
    preferences.style_inspiration?.[0]
    || preferences.preferred_outfit_types?.[0];

  if (inspiration) {
    return `${formatEnumLabel(inspiration)} Explorer`;
  }

  return null;
}
