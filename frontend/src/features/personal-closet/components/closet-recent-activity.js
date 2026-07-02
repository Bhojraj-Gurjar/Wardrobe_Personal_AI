'use client';

import { memo } from 'react';
import {
  Bookmark,
  Heart,
  Pencil,
  Share2,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { ClosetViewAllLink } from '@/features/personal-closet/components/closet-view-all-link';
import { CLOSET_PREVIEW_LIMIT } from '@/features/personal-closet/constants/closet-navigation';
import {
  CLOSET_GLASS_CARD,
} from '@/features/personal-closet/styles/closet-design-tokens';

const ICONS = {
  saved: Bookmark,
  purchased: ShoppingBag,
  shared: Share2,
  edited: Pencil,
  removed: Trash2,
  wishlist: Heart,
};

function formatActivityDate(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ClosetRecentActivity = memo(function ClosetRecentActivity({
  activities = [],
  className,
  limit = null,
  viewAllHref = null,
  totalCount = 0,
}) {
  const visibleActivities = limit == null
    ? activities
    : activities.slice(0, limit);
  const showViewAll = Boolean(viewAllHref) && totalCount > (limit ?? CLOSET_PREVIEW_LIMIT);

  return (
    <section className={cn(CLOSET_GLASS_CARD, 'overflow-hidden', className)}>
      <div className="border-b border-white/[0.08] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A855F7]">
              Recent Activity
            </p>
            <p className="mt-1 text-sm text-white/50">
              Your latest wardrobe moments and updates.
            </p>
          </div>
          {showViewAll ? <ClosetViewAllLink href={viewAllHref} /> : null}
        </div>
      </div>

      <div className="p-5">
        {!visibleActivities.length ? (
          <p className="rounded-[18px] border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center text-sm text-white/45">
            Activity will appear here as you save outfits and complete purchases.
          </p>
        ) : (
          <ol className="space-y-4">
            {visibleActivities.map((activity, index) => {
              const Icon = ICONS[activity.type] || Bookmark;

              return (
                <motion.li
                  key={activity.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative flex gap-4 pl-6"
                >
                  <span
                    className="absolute left-0 top-1.5 flex size-4 items-center justify-center rounded-full bg-[#7C3AED]/20 ring-4 ring-[#141B2D]"
                    aria-hidden="true"
                  >
                    <span className="size-1.5 rounded-full bg-[#A855F7]" />
                  </span>
                  {index < visibleActivities.length - 1 ? (
                    <span
                      className="absolute left-[7px] top-6 h-[calc(100%+0.5rem)] w-px bg-white/[0.08]"
                      aria-hidden="true"
                    />
                  ) : null}

                  <div className="min-w-0 flex-1 rounded-[18px] border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/12 text-[#C4B5FD]">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#A855F7]">
                            {activity.label}
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-white">
                            {activity.title}
                          </p>
                        </div>
                      </div>
                      <time className="shrink-0 text-[11px] text-white/40">
                        {formatActivityDate(activity.timestamp)}
                      </time>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
});

ClosetRecentActivity.displayName = 'ClosetRecentActivity';
