import {

  EMPTY_TRAIT_VALUE,

  FACE_ANALYSIS_NOT_GENERATED,

  TRAIT_ANALYSIS_CARDS,

  FACE_SCAN_SUMMARY_ROWS,

} from '../constants/face-analysis-dashboard';

import {

  formatBeardDisplay,

  formatTraitDisplay,

  getBeardStyleDescription,

  getFaceShapeDescription,

  getHairStyleDescription,

  getSkinToneDescription,

  getSkinToneSwatch,

} from './face-trait-descriptions';

import { buildFaceStyleInsights } from './face-style-insights.engine';



function toConfidence(value) {

  const parsed = Number(value);



  if (!Number.isFinite(parsed) || parsed < 0) {

    return 0;

  }



  const normalized = parsed <= 1 ? parsed * 100 : parsed;



  return Math.min(Math.round(normalized), 100);

}



function formatLastScanned(analyzedAt) {

  if (!analyzedAt) {

    return null;

  }



  const date = new Date(analyzedAt);



  if (Number.isNaN(date.getTime())) {

    return null;

  }



  return date.toLocaleDateString('en-US', {

    month: 'long',

    day: 'numeric',

    year: 'numeric',

  });

}



export function mergeFaceAnalysisDashboard(apiData) {

  const hasReport = Boolean(
    apiData?.hasAnalysis
    ?? (
      apiData?.faceShape
      && !apiData?.rawAiResponse?.isDefault
    ),
  );

  const emptyValue = FACE_ANALYSIS_NOT_GENERATED;



  const faceShape = hasReport ? formatTraitDisplay(apiData?.faceShape) : null;

  const skinTone = hasReport ? formatTraitDisplay(apiData?.skinTone) : null;

  const hairStyle = hasReport ? formatTraitDisplay(apiData?.hairStyle) : null;

  const beardStyle = hasReport ? formatBeardDisplay(apiData?.beardStyle ?? apiData?.beardType) : null;



  const faceShapeDescription = hasReport

    ? getFaceShapeDescription(apiData?.faceShape)

    : null;

  const skinToneDescription = hasReport

    ? getSkinToneDescription(apiData?.skinTone)

    : null;

  const hairStyleDescription = hasReport

    ? getHairStyleDescription(apiData?.hairStyle, apiData?.hairLength)

    : null;

  const beardStyleDescription = hasReport

    ? getBeardStyleDescription(apiData?.beardStyle ?? apiData?.beardType)

    : null;



  const traitValues = {

    faceShape: faceShape || EMPTY_TRAIT_VALUE,

    skinTone: skinTone || EMPTY_TRAIT_VALUE,

    hairStyle: hairStyle || EMPTY_TRAIT_VALUE,

    beardStyle: beardStyle || EMPTY_TRAIT_VALUE,

    faceShapeConfidence: hasReport ? toConfidence(apiData?.faceShapeConfidence) : 0,

    skinToneConfidence: hasReport ? toConfidence(apiData?.skinToneConfidence) : 0,

    hairStyleConfidence: hasReport ? toConfidence(apiData?.hairStyleConfidence) : 0,

    beardTypeConfidence: hasReport ? toConfidence(apiData?.beardTypeConfidence) : 0,

    faceShapeDescription,

    skinToneDescription,

    hairStyleDescription,

    beardStyleDescription,

    skinToneSwatch: hasReport ? getSkinToneSwatch(apiData?.skinTone) : null,

  };



  const summaryRows = FACE_SCAN_SUMMARY_ROWS.map((row) => ({

    label: row.label,

    value: hasReport ? (traitValues[row.key] || EMPTY_TRAIT_VALUE) : emptyValue,

  }));



  const analysisCards = TRAIT_ANALYSIS_CARDS.map((card) => ({

    ...card,

    value: hasReport ? (traitValues[card.valueKey] || EMPTY_TRAIT_VALUE) : emptyValue,

    confidence: traitValues[card.confidenceKey] ?? 0,

    description: hasReport ? traitValues[card.descriptionKey] : null,

    swatch: card.swatchKey ? traitValues[card.swatchKey] : null,

  }));



  const lastScanned = hasReport
    ? formatLastScanned(apiData?.analyzedAt || apiData?.updatedAt)
    : null;

  const subtitle = lastScanned

    ? `AI-powered facial feature mapping · Last scanned ${lastScanned}`

    : 'AI-powered facial feature mapping';



  const hasFacePhoto = Boolean(apiData?.faceImageUrl);



  const styleInsights = buildFaceStyleInsights(apiData, { hasReport });

  return {

    hasReport,

    hasFacePhoto,

    subtitle,

    summaryRows,

    analysisCards,

    styleInsights,
    recommendations: styleInsights.sections.flatMap((section) => section.items),

    scanButtonLabel: hasFacePhoto

      ? (hasReport ? 'Scan Again' : 'Analyze Face')

      : 'Analyze Face',

    showAnalyzedBadge: hasReport,

    faceImageUrl: apiData?.faceImageUrl || null,

    overallConfidence: hasReport ? toConfidence(apiData?.confidence) : null,

  };

}


