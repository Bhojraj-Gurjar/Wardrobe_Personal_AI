'use client';

import { memo } from 'react';
import {
  Crown,
  Palette,
  Percent,
  Shirt,
  Sparkles,
  Sun,
  Tag,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { ClosetAnimatedCounter } from '@/features/personal-closet/components/closet-animated-counter';
import {
  CLOSET_CARD_HOVER,
  CLOSET_GLASS_CARD,
} from '@/features/personal-closet/styles/closet-design-tokens';

function InsightCard({ icon: Icon, label, value, suffix = '', accent, delay = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        CLOSET_GLASS_CARD,
        CLOSET_CARD_HOVER,
        'relative overflow-hidden p-4',
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70',
          accent,
        )}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-medium text-white/50">{label}</p>
          <p className="text-2xl font-bold text-white">
            {typeof value === 'number' ? (
              <ClosetAnimatedCounter value={value} formatter={(next) => `${next}${suffix}`} />
            ) : (
              value
            )}
          </p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-xl bg-white/[0.06] text-[#C4B5FD]">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      </div>
    </motion.article>
  );
}

export const ClosetInsightsPanel = memo(function ClosetInsightsPanel({
  insights,
  className,
}) {
  if (!insights) {
    return null;
  }

  const cards = [
    {
      icon: Palette,
      label: 'Most Worn Color',
      value: insights.mostWornColor,
      accent: 'from-pink-500/15 to-rose-500/5',
    },
    {
      icon: Tag,
      label: 'Favorite Brand',
      value: insights.favoriteBrand,
      accent: 'from-indigo-500/15 to-violet-500/5',
    },
    {
      icon: Crown,
      label: 'Luxury Score',
      value: insights.luxuryScore,
      suffix: '/100',
      accent: 'from-amber-500/15 to-orange-500/5',
    },
    {
      icon: Shirt,
      label: 'Wardrobe Diversity',
      value: insights.wardrobeDiversity,
      accent: 'from-cyan-500/15 to-blue-500/5',
    },
    {
      icon: Percent,
      label: 'Formal',
      value: insights.styleMix.formal,
      suffix: '%',
      accent: 'from-violet-500/15 to-purple-500/5',
    },
    {
      icon: Percent,
      label: 'Casual',
      value: insights.styleMix.casual,
      suffix: '%',
      accent: 'from-fuchsia-500/15 to-pink-500/5',
    },
    {
      icon: Sparkles,
      label: 'Minimal',
      value: insights.styleMix.minimal,
      suffix: '%',
      accent: 'from-slate-500/15 to-zinc-500/5',
    },
    {
      icon: Sparkles,
      label: 'Streetwear',
      value: insights.styleMix.streetwear,
      suffix: '%',
      accent: 'from-emerald-500/15 to-teal-500/5',
    },
    {
      icon: Sun,
      label: 'Season Spread',
      value: `${insights.seasonDistribution.Summer}% Summer`,
      accent: 'from-yellow-500/15 to-amber-500/5',
    },
  ];

  return (
    <section className={cn('space-y-4', className)}>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A855F7]">
          Closet Insights
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">AI style intelligence</h2>
        <p className="text-sm text-white/50">
          Derived from your saved outfits, purchases, and preferences.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, index) => (
          <InsightCard key={card.label} {...card} delay={index * 0.04} />
        ))}
      </div>
    </section>
  );
});

ClosetInsightsPanel.displayName = 'ClosetInsightsPanel';
