'use client';

import { memo } from 'react';
import {
  CalendarClock,
  DollarSign,
  Heart,
  Palette,
  Shirt,
  Sparkles,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import { cn } from '@/utils/cn';
import { ClosetAnimatedCounter } from '@/features/personal-closet/components/closet-animated-counter';
import {
  CLOSET_CARD_HOVER,
  CLOSET_GLASS_CARD,
  CLOSET_HERO_GRADIENT,
} from '@/features/personal-closet/styles/closet-design-tokens';

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accent,
  formatter,
  delay = 0,
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      className={cn(
        CLOSET_GLASS_CARD,
        CLOSET_CARD_HOVER,
        'relative overflow-hidden p-4 md:p-5',
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80',
          accent,
        )}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-medium text-white/50">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            {typeof value === 'number' ? (
              <ClosetAnimatedCounter value={value} formatter={formatter} />
            ) : (
              value
            )}
          </p>
          {subtitle ? (
            <p className="text-[11px] text-white/40">{subtitle}</p>
          ) : null}
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-[#C4B5FD] shadow-[0_0_24px_rgba(124,58,237,0.15)]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </motion.article>
  );
}

export const ClosetOverviewCards = memo(function ClosetOverviewCards({
  overview,
  isLoading,
  userName = 'there',
  closetValue = 0,
  averageMatch = 0,
  lastUpdated = null,
  totalOutfits = 0,
}) {
  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : '—';

  const stats = [
    {
      key: 'outfits',
      label: 'Total Outfits',
      value: isLoading ? 0 : totalOutfits,
      subtitle: 'Curated looks in your closet',
      icon: Shirt,
      accent: 'from-violet-500/20 to-purple-600/5',
    },
    {
      key: 'saved',
      label: 'Saved Looks',
      value: isLoading ? 0 : (overview?.savedOutfits ?? 0),
      subtitle: 'From avatar, try-on & recommendations',
      icon: Sparkles,
      accent: 'from-fuchsia-500/20 to-violet-600/5',
    },
    {
      key: 'brands',
      label: 'Favorite Brands',
      value: isLoading ? 0 : (overview?.favoriteBrands ?? 0),
      subtitle: 'Brands you interact with most',
      icon: Tag,
      accent: 'from-indigo-500/20 to-blue-600/5',
    },
    {
      key: 'colors',
      label: 'Favorite Colors',
      value: isLoading ? 0 : (overview?.favoriteColors ?? 0),
      subtitle: 'Palette signals across your wardrobe',
      icon: Palette,
      accent: 'from-pink-500/20 to-rose-600/5',
    },
    {
      key: 'value',
      label: 'Closet Value',
      value: isLoading ? 0 : closetValue,
      subtitle: 'Estimated from outfits & purchases',
      icon: DollarSign,
      accent: 'from-emerald-500/20 to-teal-600/5',
      formatter: (next) => formatProductPrice(next),
    },
    {
      key: 'match',
      label: 'Avg Outfit Match',
      value: isLoading ? 0 : averageMatch,
      subtitle: 'AI compatibility across saved looks',
      icon: TrendingUp,
      accent: 'from-amber-500/20 to-orange-600/5',
      formatter: (next) => `${next}%`,
    },
    {
      key: 'updated',
      label: 'Last Updated',
      value: lastUpdatedLabel,
      subtitle: 'Most recent wardrobe activity',
      icon: CalendarClock,
      accent: 'from-slate-500/20 to-zinc-600/5',
    },
  ];

  return (
    <section className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          CLOSET_GLASS_CARD,
          CLOSET_HERO_GRADIENT,
          'relative overflow-hidden px-5 py-6 md:px-8 md:py-8',
        )}
      >
        <div className="relative space-y-3">
          <p className="inline-flex items-center gap-2 text-sm text-white/70">
            <span aria-hidden="true">👋</span>
            Welcome back
            <span className="font-semibold text-white">{userName}</span>
          </p>
          <h1 className="max-w-2xl text-2xl font-bold tracking-tight text-white md:text-4xl">
            My AI-curated luxury wardrobe
          </h1>
          <p className="max-w-xl text-sm text-white/50 md:text-base">
            Your purchases, saved outfits, and style preferences — elevated into a premium personal styling experience.
          </p>
        </div>
        <Heart
          className="pointer-events-none absolute -right-4 -top-4 size-28 text-[#7C3AED]/10"
          aria-hidden="true"
        />
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.key}
            {...stat}
            delay={0.08 + index * 0.05}
          />
        ))}
      </div>
    </section>
  );
});

ClosetOverviewCards.displayName = 'ClosetOverviewCards';
