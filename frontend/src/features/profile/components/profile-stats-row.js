'use client';

import { Heart, Package, Shirt, Star } from 'lucide-react';
import { useProfileStats } from '@/features/profile/hooks/use-profile-stats';
import { cn } from '@/utils/cn';

const STAT_CONFIG = [
  { key: 'wardrobeItems', label: 'Wardrobe Items', icon: Shirt },
  { key: 'wishlistCount', label: 'Wishlist', icon: Heart },
  { key: 'ordersCount', label: 'Orders', icon: Package },
  { key: 'styleScore', label: 'Style Score', icon: Star },
];

export function ProfileStatsRow({ className }) {
  const stats = useProfileStats();

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {STAT_CONFIG.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-5 interactive-card"
        >
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-dashboard-accent-soft text-primary">
            <Icon className="size-5" />
          </div>
          <p className="text-2xl font-bold text-dashboard-foreground">
            {stats[key] ?? '—'}
          </p>
          <p className="mt-1 text-sm text-dashboard-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}
