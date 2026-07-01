'use client';

import { memo } from 'react';
import {
  Archive,
  CheckCircle2,
  IndianRupee,
  Package,
  PartyPopper,
  Receipt,
  RotateCcw,
  Sparkles,
  Truck,
  XCircle,
} from 'lucide-react';
import { OMS_STAGE_CARDS } from '@/features/checkout/constants/checkout.constants';
import { AnimatedValue } from '@/features/admin/components/admin-metric-card';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/utils/cn';

const CARD_ICONS = {
  NEW_ORDERS: Sparkles,
  ACCEPTED: CheckCircle2,
  PACKED_RTD: Package,
  IN_TRANSIT: Truck,
  COMPLETED: PartyPopper,
  CANCELLED: XCircle,
  RETURNED: RotateCcw,
  REFUNDED: Receipt,
  ARCHIVED: Archive,
  TODAY_REVENUE: IndianRupee,
};

const ACCENT_THEMES = {
  orange: {
    iconWrap: 'bg-orange-500/15 text-orange-400 ring-orange-500/20',
    orb: 'bg-orange-500/30',
    gradient: 'from-orange-500/20 via-orange-500/5 to-transparent',
    activeBorder: 'border-orange-400/45',
    activeGlow: 'shadow-[0_0_28px_rgba(249,115,22,0.22)]',
    hoverGlow: 'hover:shadow-[0_10px_36px_rgba(249,115,22,0.14)]',
    value: 'text-orange-50',
  },
  blue: {
    iconWrap: 'bg-blue-500/15 text-blue-400 ring-blue-500/20',
    orb: 'bg-blue-500/30',
    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
    activeBorder: 'border-blue-400/45',
    activeGlow: 'shadow-[0_0_28px_rgba(59,130,246,0.22)]',
    hoverGlow: 'hover:shadow-[0_10px_36px_rgba(59,130,246,0.14)]',
    value: 'text-blue-50',
  },
  amber: {
    iconWrap: 'bg-amber-500/15 text-amber-400 ring-amber-500/20',
    orb: 'bg-amber-500/30',
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    activeBorder: 'border-amber-400/45',
    activeGlow: 'shadow-[0_0_28px_rgba(245,158,11,0.22)]',
    hoverGlow: 'hover:shadow-[0_10px_36px_rgba(245,158,11,0.14)]',
    value: 'text-amber-50',
  },
  teal: {
    iconWrap: 'bg-teal-500/15 text-teal-400 ring-teal-500/20',
    orb: 'bg-teal-500/30',
    gradient: 'from-teal-500/20 via-teal-500/5 to-transparent',
    activeBorder: 'border-teal-400/45',
    activeGlow: 'shadow-[0_0_28px_rgba(20,184,166,0.22)]',
    hoverGlow: 'hover:shadow-[0_10px_36px_rgba(20,184,166,0.14)]',
    value: 'text-teal-50',
  },
  green: {
    iconWrap: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
    orb: 'bg-emerald-500/30',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    activeBorder: 'border-emerald-400/45',
    activeGlow: 'shadow-[0_0_28px_rgba(16,185,129,0.22)]',
    hoverGlow: 'hover:shadow-[0_10px_36px_rgba(16,185,129,0.14)]',
    value: 'text-emerald-50',
  },
  red: {
    iconWrap: 'bg-red-500/15 text-red-400 ring-red-500/20',
    orb: 'bg-red-500/30',
    gradient: 'from-red-500/20 via-red-500/5 to-transparent',
    activeBorder: 'border-red-400/45',
    activeGlow: 'shadow-[0_0_28px_rgba(239,68,68,0.22)]',
    hoverGlow: 'hover:shadow-[0_10px_36px_rgba(239,68,68,0.14)]',
    value: 'text-red-50',
  },
  purple: {
    iconWrap: 'bg-violet-500/15 text-violet-400 ring-violet-500/20',
    orb: 'bg-violet-500/30',
    gradient: 'from-violet-500/20 via-violet-500/5 to-transparent',
    activeBorder: 'border-violet-400/45',
    activeGlow: 'shadow-[0_0_28px_rgba(139,92,246,0.24)]',
    hoverGlow: 'hover:shadow-[0_10px_36px_rgba(139,92,246,0.16)]',
    value: 'text-violet-50',
  },
  gold: {
    iconWrap: 'bg-yellow-500/15 text-yellow-400 ring-yellow-500/20',
    orb: 'bg-yellow-500/30',
    gradient: 'from-yellow-500/20 via-yellow-500/5 to-transparent',
    activeBorder: 'border-yellow-400/45',
    activeGlow: 'shadow-[0_0_28px_rgba(234,179,8,0.22)]',
    hoverGlow: 'hover:shadow-[0_10px_36px_rgba(234,179,8,0.14)]',
    value: 'text-yellow-50',
  },
};

const OmsSummaryCard = memo(function OmsSummaryCard({
  card,
  value,
  active,
  onSelect,
}) {
  const theme = ACCENT_THEMES[card.accent] || ACCENT_THEMES.purple;
  const Icon = CARD_ICONS[card.id];
  const isFilterable = card.filterable !== false;
  const formatValue = card.format === 'currency' ? formatCurrency : undefined;
  const Comp = isFilterable ? 'button' : 'div';

  return (
    <Comp
      type={isFilterable ? 'button' : undefined}
      onClick={isFilterable ? () => onSelect(card.id) : undefined}
      className={cn(
        'group relative flex h-full min-h-[5.5rem] flex-col overflow-hidden rounded-xl',
        'border border-white/[0.08] bg-dashboard-surface/55 p-3.5 text-left',
        'shadow-[0_4px_24px_rgba(0,0,0,0.22)] backdrop-blur-xl',
        'transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out',
        'will-change-transform',
        isFilterable && 'cursor-pointer',
        isFilterable && theme.hoverGlow,
        isFilterable && 'hover:-translate-y-1 hover:border-white/[0.14] hover:bg-dashboard-surface/70',
        active && theme.activeBorder,
        active && theme.activeGlow,
        active && 'z-[1] -translate-y-0.5 bg-dashboard-surface/80 ring-1 ring-white/[0.12]',
        active && 'scale-[1.02]',
        card.id === 'TODAY_REVENUE' && 'ring-1 ring-yellow-500/10',
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80',
          theme.gradient,
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -right-6 -top-6 size-20 rounded-full blur-2xl transition-opacity duration-300',
          theme.orb,
          'opacity-40 group-hover:opacity-60',
        )}
      />

      <div className="relative flex items-start justify-between gap-2">
        {Icon ? (
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg ring-1',
              'transition-transform duration-300 group-hover:scale-105',
              theme.iconWrap,
            )}
          >
            <Icon className="size-4" strokeWidth={2.25} aria-hidden="true" />
          </span>
        ) : null}
        {active ? (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
            Active
          </span>
        ) : null}
      </div>

      <p className="relative mt-2.5 line-clamp-1 text-[11px] font-medium uppercase tracking-wide text-dashboard-muted">
        {card.title}
      </p>
      <p className={cn('relative mt-0.5 text-xl font-bold tabular-nums tracking-tight', theme.value)}>
        {typeof value === 'number' ? (
          <AnimatedValue value={value} formatValue={formatValue} />
        ) : (
          value
        )}
      </p>
    </Comp>
  );
});

export const AdminOmsSummaryCards = memo(function AdminOmsSummaryCards({
  metrics,
  activeTab,
  onCardSelect,
}) {
  const displayMetrics = {
    ...metrics,
    refunded: metrics?.refunded ?? metrics?.by_status?.REFUNDED ?? 0,
    archived: metrics?.archived ?? metrics?.by_status?.ARCHIVED ?? 0,
  };

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
      {OMS_STAGE_CARDS.map((card) => (
        <OmsSummaryCard
          key={card.id}
          card={card}
          value={displayMetrics[card.metricKey] ?? 0}
          active={card.filterable !== false && activeTab === card.id}
          onSelect={onCardSelect}
        />
      ))}
    </div>
  );
});
