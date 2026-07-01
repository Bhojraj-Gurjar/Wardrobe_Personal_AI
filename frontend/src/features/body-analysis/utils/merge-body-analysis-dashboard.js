import {
  BODY_EMPTY_PHOTO_MESSAGE,
  BODY_EMPTY_ANALYSIS_MESSAGE,
  BODY_PHOTO_SUMMARY_ROWS,
  FIT_GUIDE_SECTIONS,
  MEASUREMENT_ROWS,
  PROPORTION_AXES,
} from '../constants/body-analysis-dashboard';
import { resolveBodyPhotoUrl } from './resolve-body-photo-url';

const CM_PER_INCH = 2.54;

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function cmToInches(cm) {
  if (cm === null || cm === undefined) {
    return null;
  }

  return Math.round(cm / CM_PER_INCH);
}

function buildDualUnit(cmValue) {
  const cm = toNumber(cmValue);

  if (cm === null) {
    return { cm: null, inches: null };
  }

  return {
    cm: Math.round(cm),
    inches: cmToInches(cm),
  };
}

function readMeasurementCm(apiData, keys) {
  if (!apiData?.hasAnalysis) {
    return null;
  }

  const measurements = apiData?.measurements || {};

  for (const key of keys) {
    const field = measurements[key];
    const fieldValue = field?.value ?? field;

    if (toNumber(fieldValue) !== null) {
      return toNumber(fieldValue);
    }

    const camelKey = key === 'shoulderWidth' ? 'shoulderWidthCm' : `${key}Cm`;
    const topLevel =
      apiData?.[key]
      ?? apiData?.[camelKey]
      ?? (key === 'legLength' ? apiData?.inseamCm : null)
      ?? (key === 'shoulderWidth' ? apiData?.shoulderWidthCm : null);

    if (toNumber(topLevel) !== null) {
      return toNumber(topLevel);
    }
  }

  return null;
}

const EMPTY_VALUE = '—';

function formatSummaryValue(value, format) {
  const numeric = toNumber(value);

  if (format === 'cm') {
    if (numeric === null) {
      return EMPTY_VALUE;
    }

    return `${Math.round(numeric)} cm`;
  }

  if (value === null || value === undefined || String(value).trim() === '') {
    return EMPTY_VALUE;
  }

  return String(value);
}

function readTraitValue(apiData, apiKeys) {
  if (!apiData?.hasAnalysis) {
    return null;
  }

  for (const key of apiKeys) {
    const camelKey = key === 'shoulderWidth' ? 'shoulderWidthCm' : `${key}Cm`;
    const value = apiData?.[key] ?? apiData?.[camelKey];

    if (toNumber(value) !== null || (value !== null && value !== undefined && value !== '')) {
      return value;
    }
  }

  return null;
}

function buildPhotoSummaryRows(apiData, hasAnalysis) {
  return BODY_PHOTO_SUMMARY_ROWS.map((row) => {
    const raw = hasAnalysis ? readTraitValue(apiData, row.apiKeys) : null;

    return {
      label: row.label,
      value: formatSummaryValue(raw, row.format),
    };
  });
}

function normalizedToScore(normalized) {
  const value = toNumber(normalized);

  if (value === null) {
    return null;
  }

  return Math.max(35, Math.min(95, Math.round(value * 100)));
}

function buildProportions(apiData) {
  if (!apiData?.hasAnalysis) {
    return { data: {}, hasValue: false };
  }

  const proportionScores = apiData?.proportionScores || apiData?.rawAiResponse?.proportionScores;
  const measurements = apiData?.measurements || {};
  const result = {};
  let hasValue = false;

  for (const axis of PROPORTION_AXES) {
    let score = null;

    for (const key of axis.measurementKeys) {
      if (proportionScores?.[key] != null) {
        score = Math.max(5, Math.min(95, Math.round(Number(proportionScores[key]))));
        hasValue = true;
        break;
      }
    }

    if (score === null) {
      for (const key of axis.measurementKeys) {
        const field = measurements[key];
        const normalized = field?.normalized;

        if (normalizedToScore(normalized) !== null) {
          score = normalizedToScore(normalized);
          hasValue = true;
          break;
        }
      }
    }

    result[axis.label] = score;
  }

  return { data: result, hasValue };
}

function shortenRecommendation(section) {
  if (!section) {
    return null;
  }

  if (section.fit) {
    return section.fit;
  }

  if (Array.isArray(section.recommendations) && section.recommendations.length) {
    const first = section.recommendations[0];
    const second = section.recommendations[1];

    if (second) {
      return `${first}, ${second.charAt(0).toLowerCase()}${second.slice(1)}`;
    }

    return first;
  }

  if (Array.isArray(section.tips) && section.tips[0]) {
    return section.tips[0];
  }

  return null;
}

function buildFitGuide(fitProfile, hasAnalysis) {
  if (!hasAnalysis) {
    return FIT_GUIDE_SECTIONS.map((config) => ({
      id: config.id,
      title: config.title,
      icon: config.icon,
      iconClass: config.iconClass,
      recommendation: null,
      isEmpty: true,
    }));
  }

  const sectionMap = new Map();
  const sections = Array.isArray(fitProfile?.sections) ? fitProfile.sections : [];

  for (const section of sections) {
    if (section?.id) {
      sectionMap.set(section.id, section);
    }
  }

  return FIT_GUIDE_SECTIONS.map((config) => {
    const section = sectionMap.get(config.id);
    const richRecommendations = Array.isArray(section?.recommendations)
      ? section.recommendations.filter(Boolean)
      : [];
    const isRich = richRecommendations.some((item) => typeof item === 'object' && item?.name);
    const recommendation = isRich
      ? richRecommendations[0]?.name || null
      : shortenRecommendation(section);

    return {
      id: config.id,
      title: config.title,
      icon: config.icon,
      iconClass: config.iconClass,
      recommendation,
      why: section?.why || null,
      recommendations: richRecommendations,
      avoid: Array.isArray(section?.avoid) ? section.avoid : [],
      products: Array.isArray(section?.products) ? section.products : [],
      isEmpty: !section || (!recommendation && !richRecommendations.length),
    };
  });
}

function buildLastUpdatedLabel(updatedAt, hasAnalysis, hasBodyPhoto) {
  if (!hasBodyPhoto && !hasAnalysis) {
    return BODY_EMPTY_PHOTO_MESSAGE;
  }

  if (!hasAnalysis) {
    return hasBodyPhoto
      ? 'Using your onboarding body photo. Generating measurements…'
      : BODY_EMPTY_ANALYSIS_MESSAGE;
  }

  if (!updatedAt) {
    return 'Personalized measurements & body type profile';
  }

  const updated = new Date(updatedAt);
  const today = new Date();
  const isToday =
    updated.getFullYear() === today.getFullYear()
    && updated.getMonth() === today.getMonth()
    && updated.getDate() === today.getDate();

  if (isToday) {
    return 'Last analyzed today · Personalized measurements & body type profile';
  }

  return `Last analyzed ${updated.toLocaleDateString()} · Personalized measurements & body type profile`;
}

function buildMeasurements(apiData) {
  const result = {};

  for (const row of MEASUREMENT_ROWS) {
    const cm = readMeasurementCm(apiData, row.apiKeys);
    const dual = buildDualUnit(cm);

    result[row.key] = {
      label: row.label,
      cm: dual.cm,
      inches: dual.inches,
    };
  }

  return result;
}

export function mergeBodyAnalysisDashboard(apiData, profile) {
  const hasAnalysis = Boolean(
    apiData?.hasAnalysis
    ?? (
      apiData?.bodyType
      && !apiData?.rawAiResponse?.isDefault
    ),
  );
  const bodyImageUrl = apiData?.bodyPhotoMissing
    ? null
    : resolveBodyPhotoUrl(apiData, profile);
  const hasBodyPhoto = Boolean(bodyImageUrl);
  const bodyType = hasAnalysis ? (apiData?.bodyType || null) : null;
  const bodyShape = hasAnalysis ? (apiData?.bodyShape || null) : null;
  const proportions = buildProportions(apiData);
  const radarData = Object.entries(proportions.data)
    .filter(([, value]) => value !== null)
    .map(([axis, value]) => ({
      axis,
      value,
    }));

  return {
    hasAnalysis,
    hasReport: hasAnalysis,
    hasBodyPhoto,
    bodyImageUrl,
    bodyType: bodyType || '—',
    bodyShape: bodyShape || '—',
    photoSummaryRows: buildPhotoSummaryRows(apiData, hasAnalysis),
    measurements: buildMeasurements(apiData),
    radarData,
    fitGuide: buildFitGuide(apiData?.fitProfile, hasAnalysis),
    sizeRecommendations: hasAnalysis
      ? (apiData?.sizeRecommendations || apiData?.rawAiResponse?.sizeRecommendations || null)
      : null,
    lastUpdatedLabel: buildLastUpdatedLabel(
      apiData?.analyzedAt || apiData?.updatedAt,
      hasAnalysis,
      hasBodyPhoto,
    ),
    scanButtonLabel: hasAnalysis
      ? 'Scan Again'
      : (hasBodyPhoto ? 'Analyze Body' : 'Upload Body Photo'),
    emptyPhotoMessage: BODY_EMPTY_PHOTO_MESSAGE,
    emptyAnalysisMessage: BODY_EMPTY_ANALYSIS_MESSAGE,
    confidence: hasAnalysis ? (apiData?.confidence ?? null) : null,
  };
}
