'use client';

import { ShoppingBag } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  fashionDnaCardHeaderGapClass,
  fashionDnaCardShell,
  fashionDnaCardSubtitleClass,
  fashionDnaCardTitleClass,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 md:rounded-2xl md:px-4 md:py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-dashboard-muted md:text-[11px]">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-bold text-dashboard-foreground md:mt-1 md:text-2xl">{value}</p>
    </div>
  );
}

export function ShoppingInfluenceCard({ shoppingInfluence = null, className }) {
  const influence = shoppingInfluence || {};

  const metrics = [
    { label: 'Views', value: influence.productViews || 0 },
    { label: 'Wishlist', value: influence.wishlistAdds || 0 },
    { label: 'Cart', value: influence.cartAdds || 0 },
    { label: 'Purchases', value: influence.purchases || 0 },
    { label: 'Try-Ons', value: influence.tryOns || 0 },
    { label: 'Searches', value: influence.searches || 0 },
  ];

  const topCategories = Object.entries(influence.favoriteCategories || {})
    .sort(([, left], [, right]) => right - left)
    .slice(0, 4)
    .map(([key]) => key.replace(/_/g, ' '));

  return (
    <section className={fashionDnaCardShell(className)}>
      <div className={cn('flex items-center gap-2.5 md:gap-3', fashionDnaCardHeaderGapClass)}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#C4B5FD] md:size-10 md:rounded-2xl">
          <ShoppingBag className="size-4 md:size-5" />
        </div>
        <div>
          <h3 className={fashionDnaCardTitleClass}>Shopping Influence</h3>
          <p className={fashionDnaCardSubtitleClass}>How your shopping activity shapes your DNA</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3">
        {metrics.map((metric) => (
          <Metric key={metric.label} {...metric} />
        ))}
      </div>

      {topCategories.length ? (
        <div className="mt-3 md:mt-5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-dashboard-muted md:mb-2 md:text-xs">
            Influenced categories
          </p>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {topCategories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-primary/25 bg-[#8B5CF6]/10 px-2.5 py-0.5 text-[11px] font-medium text-dashboard-foreground md:px-3 md:py-1 md:text-xs"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-dashboard-muted md:mt-5 md:text-sm">
          Browse products, save favorites, and shop to build your influence profile.
        </p>
      )}
    </section>
  );
}
