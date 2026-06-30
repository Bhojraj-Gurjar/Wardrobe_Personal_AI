export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

export const BODY_TYPE_OPTIONS = [
  { value: 'SLIM', label: 'Slim' },
  { value: 'ATHLETIC', label: 'Athletic' },
  { value: 'AVERAGE', label: 'Average' },
  { value: 'CURVY', label: 'Curvy' },
  { value: 'PLUS_SIZE', label: 'Plus size' },
];

export const SKIN_TONE_OPTIONS = [
  { value: 'FAIR', label: 'Fair' },
  { value: 'LIGHT', label: 'Light' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'OLIVE', label: 'Olive' },
  { value: 'TAN', label: 'Tan' },
  { value: 'BROWN', label: 'Brown' },
  { value: 'DARK', label: 'Dark' },
];

function formatEnumLabel(value) {
  if (!value) return 'Not set';
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export { formatEnumLabel };
