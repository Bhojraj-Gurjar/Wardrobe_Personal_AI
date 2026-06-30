import { cn } from '@/utils/cn';

export function fashionDnaCardShell(className) {
  return cn(
    'flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-dashboard-border',
    'bg-gradient-to-b from-dashboard-surface via-dashboard-surface to-dashboard-surface-elevated/70',
    'p-3 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm',
    'md:rounded-[24px] md:bg-[#1A2235] md:p-6 md:shadow-lg md:backdrop-blur-none',
    className,
  );
}

export const fashionDnaCardTitleClass =
  'text-sm font-semibold text-dashboard-foreground md:text-base';

export const fashionDnaCardSubtitleClass =
  'mt-0.5 text-[11px] leading-snug text-dashboard-muted md:mt-1 md:text-xs';

export const fashionDnaCardHeaderGapClass = 'mb-3 md:mb-5';

export const fashionDnaChartWrapClass =
  'mt-2 min-h-[200px] flex-1 md:mt-4 md:min-h-[280px]';

export const fashionDnaChartEmptyClass =
  'flex h-full min-h-[200px] items-center justify-center text-xs text-dashboard-muted md:min-h-[280px] md:text-sm';

export function resolveConfidenceTier(score) {
  if (score == null || !Number.isFinite(Number(score))) {
    return 'Pending';
  }

  const value = Number(score);
  if (value >= 70) return 'High';
  if (value >= 50) return 'Medium';
  if (value >= 30) return 'Moderate';
  return 'Developing';
}

export function formatScoreFraction(score) {
  if (score == null || !Number.isFinite(Number(score))) {
    return '— / 100';
  }

  return `${Math.round(Number(score))} / 100`;
}
