'use client';

import Link from 'next/link';
import {
  Heart,
  Package,
  Shirt,
  Sparkles,
  ScanFace,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ProfilePremiumCard } from '@/features/profile/components/profile-premium-card';
import { AnimatedCounter, ProfileMotionGridItem } from '@/features/profile/components/profile-motion';
import { cn } from '@/utils/cn';

const STAT_CONFIG = [
  {
    key: 'closetItems',
    label: 'Closet Items',
    subtitle: 'In your personal wardrobe',
    icon: Shirt,
    href: ROUTES.MY_CLOSET,
    accent: 'from-violet-500/20 to-purple-600/10',
  },
  {
    key: 'savedLooks',
    label: 'Saved Looks',
    subtitle: 'Curated outfits you love',
    icon: Sparkles,
    href: ROUTES.MY_CLOSET,
    accent: 'from-fuchsia-500/20 to-violet-600/10',
  },
  {
    key: 'wishlistCount',
    label: 'Wishlist Items',
    subtitle: 'Pieces on your radar',
    icon: Heart,
    href: ROUTES.WISHLIST,
    accent: 'from-pink-500/20 to-rose-600/10',
  },
  {
    key: 'ordersCount',
    label: 'Orders',
    subtitle: 'Purchases delivered',
    icon: Package,
    href: ROUTES.ORDERS,
    accent: 'from-indigo-500/20 to-blue-600/10',
  },
  {
    key: 'tryOnCount',
    label: 'Try-On Sessions',
    subtitle: 'Virtual fitting history',
    icon: ScanFace,
    href: ROUTES.AI.VIRTUAL_TRY_ON,
    accent: 'from-emerald-500/20 to-teal-600/10',
  },
];

function StatCard({ config, count, isLoading, index }) {
  const Icon = config.icon;
  const content = (
    <div
      className={cn(
        'group relative h-full overflow-hidden rounded-2xl border border-white/[0.08]',
        'bg-white/[0.03] p-5 transition-all duration-300',
        'hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10',
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity duration-300 group-hover:opacity-100',
          config.accent,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-dashboard-muted">{config.label}</p>
          <p className="text-3xl font-semibold tracking-tight text-dashboard-foreground">
            {isLoading ? '—' : <AnimatedCounter value={count} />}
          </p>
          <p className="text-xs text-dashboard-muted">{config.subtitle}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform duration-300 group-hover:scale-110">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );

  return (
    <ProfileMotionGridItem index={index}>
      {config.href ? (
        <Link href={config.href} className="block h-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </ProfileMotionGridItem>
  );
}

export function WardrobeStats({ stats, isLoading }) {
  return (
    <ProfilePremiumCard
      title="Wardrobe Overview"
      description="Your closet, looks, and shopping activity at a glance"
      icon={Shirt}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {STAT_CONFIG.map((config, index) => (
          <StatCard
            key={config.key}
            config={config}
            count={stats?.[config.key] ?? 0}
            isLoading={isLoading}
            index={index}
          />
        ))}
      </div>
    </ProfilePremiumCard>
  );
}
