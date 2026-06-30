'use client';

import { memo } from 'react';
import { Shirt, Star, Sparkles, Heart } from 'lucide-react';
import { StatCard } from '@/features/dashboard/components/stat-card';
import { cn } from '@/utils/cn';

const ICONS = {
  wardrobe: Shirt,
  style: Star,
  matches: Sparkles,
  saved: Heart,
};

const TONE_CLASSES = {
  primary: 'text-primary bg-dashboard-accent-soft',
  warning: 'text-dashboard-warning bg-dashboard-warning/10',
  info: 'text-dashboard-info bg-dashboard-info/10',
  pink: 'text-dashboard-pink bg-dashboard-pink/10',
};

export const StatsGrid = memo(function StatsGrid({ stats, className }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4',
        className,
      )}
    >
      {stats.map((stat) => {
        const Icon = ICONS[stat.id] || Sparkles;
        const toneClass = TONE_CLASSES[stat.trendTone] || TONE_CLASSES.primary;

        return (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            trend={stat.trend}
            isMock={stat.isMock}
            isLoading={stat.isLoading}
            icon={Icon}
            iconClassName={toneClass}
            href={stat.href}
          />
        );
      })}
    </div>
  );
});
