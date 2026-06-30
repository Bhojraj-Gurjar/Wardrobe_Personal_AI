function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

function formatLabel(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const FACE_SHAPE_DESCRIPTIONS = {
  oval: 'Balanced proportions · Versatile styling',
  round: 'Soft contours · Add vertical structure',
  square: 'Strong jawline · Soften with rounded necklines',
  heart: 'Wider forehead · Balance with lower volume',
  diamond: 'Defined cheekbones · Highlight upper frame',
  oblong: 'Elongated profile · Break vertical lines',
  rectangle: 'Angular structure · Soft layers work well',
};

const SKIN_TONE_DESCRIPTIONS = {
  fair: 'Cool undertones · Light complexion',
  light: 'Neutral undertones · Soft contrast',
  medium: 'Golden undertones · Olive complexion',
  wheatish: 'Warm undertones · Sun-kissed balance',
  tan: 'Warm undertones · Rich complexion',
  olive: 'Golden undertones · Olive complexion',
  brown: 'Deep warmth · Rich undertones',
  dark: 'Deep tones · Bold contrast styling',
};

const SKIN_TONE_SWATCHES = {
  fair: '#F5D0C5',
  light: '#E8B89A',
  medium: '#C68658',
  wheatish: '#B8864B',
  tan: '#A67C52',
  olive: '#8D6E4C',
  brown: '#6B4423',
  dark: '#4A2F23',
};

const HAIR_STYLE_DESCRIPTIONS = {
  soft_waves: 'Medium length · Natural texture',
  short_straight: 'Short length · Clean structure',
  long_curly: 'Long length · Defined texture',
  straight: 'Sleek finish · Low maintenance',
  wavy: 'Natural movement · Soft volume',
  curly: 'Defined curls · Texture-forward',
};

const BEARD_STYLE_DESCRIPTIONS = {
  clean_shaven: 'Smooth skin · Defined jawline',
  clean_shaven_alt: 'Smooth skin · Defined jawline',
  none: 'Smooth skin · Defined jawline',
  light_beard: 'Light coverage · Soft definition',
  stubble: 'Light coverage · Casual edge',
  full_beard: 'Full coverage · Strong frame',
  beard: 'Full coverage · Strong frame',
};

export function getFaceShapeDescription(faceShape) {
  const key = normalizeKey(faceShape);
  return FACE_SHAPE_DESCRIPTIONS[key] || null;
}

export function getSkinToneDescription(skinTone) {
  const key = normalizeKey(skinTone);
  return SKIN_TONE_DESCRIPTIONS[key] || null;
}

export function getSkinToneSwatch(skinTone) {
  const key = normalizeKey(skinTone);
  return SKIN_TONE_SWATCHES[key] || '#C68658';
}

export function getHairStyleDescription(hairStyle, hairLength) {
  const styleKey = normalizeKey(hairStyle);
  const mapped = HAIR_STYLE_DESCRIPTIONS[styleKey];

  if (mapped) {
    return mapped;
  }

  const length = formatLabel(hairLength);
  const style = formatLabel(hairStyle);

  if (length && style) {
    return `${length} length · ${style}`;
  }

  if (style) {
    return `${style} · Natural texture`;
  }

  return null;
}

export function getBeardStyleDescription(beardType) {
  const key = normalizeKey(beardType);

  if (key === 'clean_shaven' || key === 'none' || key === 'clean') {
    return BEARD_STYLE_DESCRIPTIONS.clean_shaven;
  }

  return BEARD_STYLE_DESCRIPTIONS[key] || null;
}

export function formatTraitDisplay(value) {
  if (!value) {
    return null;
  }

  return formatLabel(value);
}

export function formatBeardDisplay(beardType) {
  const key = normalizeKey(beardType);

  if (!beardType && beardType !== 0) {
    return null;
  }

  if (key === 'none' || key === 'clean' || key === 'clean_shaven' || key === 'clean_shave') {
    return 'Clean Shaven';
  }

  return formatLabel(beardType);
}
