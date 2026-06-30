import { Circle, ScanFace, Sparkles, UserRound } from 'lucide-react';

export const FACE_DASHBOARD_CARD_CLASS =
  'rounded-[24px] border border-white/8 bg-[#1A2236] shadow-lg';

export const FACE_PAGE_BACKGROUND = '#070B1A';

export const EMPTY_TRAIT_VALUE = '—';

export const FACE_ANALYSIS_NOT_GENERATED = 'Face analysis not generated yet';

export const TRAIT_ANALYSIS_CARDS = [
  {
    id: 'face-shape',
    title: 'FACE SHAPE',
    valueKey: 'faceShape',
    confidenceKey: 'faceShapeConfidence',
    descriptionKey: 'faceShapeDescription',
    icon: Circle,
    iconClass: 'text-[#8B5CF6]',
    progressClass: 'bg-[#8B5CF6]',
  },
  {
    id: 'skin-tone',
    title: 'SKIN TONE',
    valueKey: 'skinTone',
    confidenceKey: 'skinToneConfidence',
    descriptionKey: 'skinToneDescription',
    swatchKey: 'skinToneSwatch',
    progressClass: 'bg-[#F59E0B]',
  },
  {
    id: 'hair-style',
    title: 'HAIR STYLE',
    valueKey: 'hairStyle',
    confidenceKey: 'hairStyleConfidence',
    descriptionKey: 'hairStyleDescription',
    icon: Sparkles,
    iconClass: 'text-[#8B5CF6]',
    progressClass: 'bg-[#8B5CF6]',
  },
  {
    id: 'beard-style',
    title: 'BEARD STYLE',
    valueKey: 'beardStyle',
    confidenceKey: 'beardTypeConfidence',
    descriptionKey: 'beardStyleDescription',
    icon: UserRound,
    iconClass: 'text-[#22C55E]',
    progressClass: 'bg-[#22C55E]',
  },
];

export const FACE_SCAN_SUMMARY_ROWS = [
  { label: 'Face Shape', key: 'faceShape' },
  { label: 'Skin Tone', key: 'skinTone' },
  { label: 'Hair Style', key: 'hairStyle' },
  { label: 'Beard Style', key: 'beardStyle' },
];
