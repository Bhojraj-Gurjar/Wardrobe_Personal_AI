const COLOR_HEX_MAP = {
  black: '#1a1a1a',
  white: '#f5f5f5',
  navy: '#1e3a5f',
  blue: '#3b82f6',
  red: '#ef4444',
  green: '#22c55e',
  grey: '#9ca3af',
  gray: '#9ca3af',
  beige: '#d4c4a8',
  brown: '#8b5e3c',
  pink: '#ec4899',
  purple: '#a855f7',
  yellow: '#eab308',
  orange: '#f97316',
  cream: '#fffdd0',
  olive: '#6b8e23',
  burgundy: '#800020',
  maroon: '#800000',
  khaki: '#c3b091',
  denim: '#1560bd',
  charcoal: '#36454f',
  tan: '#d2b48c',
  gold: '#d4af37',
  silver: '#c0c0c0',
};

export function normalizeColorName(color) {
  if (!color || typeof color !== 'string') {
    return null;
  }

  const trimmed = color.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed
    .split(/[\s,/]+/)[0]
    .replace(/[^a-zA-Z-]/g, '')
    .toLowerCase();
}

export function toDisplayColorName(color) {
  const normalized = normalizeColorName(color);

  if (!normalized) {
    return 'Unknown';
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function resolveColorHex(color) {
  const normalized = normalizeColorName(color);

  if (!normalized) {
    return '#6b7280';
  }

  return COLOR_HEX_MAP[normalized] || '#6b7280';
}
