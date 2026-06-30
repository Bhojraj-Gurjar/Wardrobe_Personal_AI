import {
  Briefcase,
  Footprints,
  Layers,
  Shirt,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

export const BODY_DASHBOARD_CARD_CLASS =
  'rounded-[24px] border border-dashboard-border bg-[#1A2235] shadow-lg';

export const BODY_PHOTO_SUMMARY_ROWS = [
  { key: 'bodyType', label: 'Body Type', apiKeys: ['bodyType'], format: 'text' },
  { key: 'height', label: 'Height', apiKeys: ['height'], format: 'cm' },
  { key: 'shoulderWidth', label: 'Shoulder Width', apiKeys: ['shoulderWidth'], format: 'cm' },
  { key: 'chest', label: 'Chest', apiKeys: ['chest'], format: 'cm' },
  { key: 'waist', label: 'Waist', apiKeys: ['waist'], format: 'cm' },
  { key: 'hip', label: 'Hip', apiKeys: ['hip'], format: 'cm' },
  { key: 'armLength', label: 'Arm Length', apiKeys: ['armLength'], format: 'cm' },
  { key: 'legLength', label: 'Leg Length', apiKeys: ['legLength'], format: 'cm' },
];

export const BODY_EMPTY_PHOTO_MESSAGE =
  'Upload a full body photo during onboarding to generate body analysis.';

export const BODY_EMPTY_ANALYSIS_MESSAGE = 'Body analysis not generated yet';

export const MEASUREMENT_ROWS = [
  { key: 'height', label: 'Height', apiKeys: ['height'] },
  { key: 'chest', label: 'Chest', apiKeys: ['chest'] },
  { key: 'waist', label: 'Waist', apiKeys: ['waist'] },
  { key: 'hip', label: 'Hip', apiKeys: ['hip'] },
  { key: 'shoulder', label: 'Shoulder', apiKeys: ['shoulderWidth', 'shoulder'] },
  { key: 'inseam', label: 'Inseam', apiKeys: ['legLength', 'inseam'] },
];

export const PROPORTION_AXES = [
  { key: 'shoulders', label: 'Shoulders', measurementKeys: ['shoulderWidth'] },
  { key: 'chest', label: 'Chest', measurementKeys: ['chest'] },
  { key: 'waist', label: 'Waist', measurementKeys: ['waist'] },
  { key: 'hips', label: 'Hips', measurementKeys: ['hip'] },
  { key: 'legs', label: 'Legs', measurementKeys: ['legLength'] },
  { key: 'arms', label: 'Arms', measurementKeys: ['armLength'] },
];

export const FIT_GUIDE_SECTIONS = [
  {
    id: 'tops',
    title: 'Tops',
    icon: Shirt,
    iconClass: 'bg-sky-500/15 text-sky-300',
    fallbackRecommendation: 'Slim-fit, avoid boxy shapes',
  },
  {
    id: 'bottoms',
    title: 'Bottoms',
    icon: SlidersHorizontal,
    iconClass: 'bg-indigo-500/15 text-indigo-300',
    fallbackRecommendation: 'Slim or straight leg trousers',
  },
  {
    id: 'outerwear',
    title: 'Outerwear',
    icon: Layers,
    iconClass: 'bg-amber-500/15 text-amber-300',
    fallbackRecommendation: 'Fitted coats, natural shoulder',
  },
  {
    id: 'formal',
    title: 'Formal',
    icon: Briefcase,
    iconClass: 'bg-violet-500/15 text-violet-300',
    fallbackRecommendation: 'Single-button suits, no padding',
  },
  {
    id: 'casual',
    title: 'Casual',
    icon: Sparkles,
    iconClass: 'bg-emerald-500/15 text-emerald-300',
    fallbackRecommendation: 'Fitted tees, tapered joggers',
  },
  {
    id: 'footwear',
    title: 'Footwear',
    icon: Footprints,
    iconClass: 'bg-fuchsia-500/15 text-fuchsia-300',
    fallbackRecommendation: 'Sleek silhouettes, avoid chunky soles',
  },
];
