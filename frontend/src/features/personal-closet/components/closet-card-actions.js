import { cn } from '@/utils/cn';
import { CLOSET_TRANSITION } from '@/features/personal-closet/styles/closet-design-tokens';

export const CLOSET_ACTION_BASE = cn(
  'inline-flex cursor-pointer select-none items-center justify-center',
  'rounded-xl border text-xs font-semibold',
  CLOSET_TRANSITION,
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141B2D]',
  'disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.96]',
);

export const CLOSET_ICON_ACTION = cn(
  CLOSET_ACTION_BASE,
  'size-9 shrink-0',
  'border-white/[0.08] bg-white/[0.04] text-white/75',
  'hover:-translate-y-0.5 hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/15 hover:text-white hover:shadow-[0_0_20px_rgba(124,58,237,0.28)]',
);

export const CLOSET_VIEW_BUTTON = cn(
  CLOSET_ICON_ACTION,
  'border-[#7C3AED]/50 bg-[#7C3AED]/20 text-white',
  'hover:bg-[#7C3AED]/30',
);

export const CLOSET_SECONDARY_BUTTON = CLOSET_ICON_ACTION;

export const CLOSET_REMOVE_BUTTON = cn(
  CLOSET_ICON_ACTION,
  'border-red-500/35 bg-red-500/10 text-red-300',
  'hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-200 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]',
);

export const CLOSET_DELETE_FULL_BUTTON = cn(
  CLOSET_ACTION_BASE,
  'h-10 w-full gap-2 px-4',
  'border-red-500/35 bg-red-500/10 text-red-300',
  'hover:-translate-y-0.5 hover:border-red-500/50 hover:bg-red-500/18 hover:shadow-[0_8px_24px_rgba(239,68,68,0.15)]',
);

/** @deprecated Use CLOSET_ICON_ACTION — kept for backward compatibility */
export const CLOSET_ACTION_BASE_LEGACY = CLOSET_ACTION_BASE;
