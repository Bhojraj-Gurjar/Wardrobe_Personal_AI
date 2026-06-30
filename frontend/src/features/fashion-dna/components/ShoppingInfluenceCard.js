'use client';

import { ShoppingBag } from 'lucide-react';
import { cn } from '@/utils/cn';

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-dashboard-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-dashboard-foreground">{value}</p>
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
    <section
      className={cn(
        'rounded-[24px] border border-dashboard-border bg-[#1A2235] p-6',
        className,
      )}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-[#8B5CF6]/15 text-[#C4B5FD]">
          <ShoppingBag className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-dashboard-foreground">Shopping Influence</h3>
          <p className="text-sm text-dashboard-muted">How your shopping activity shapes your DNA</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <Metric key={metric.label} {...metric} />
        ))}
      </div>

      {topCategories.length ? (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dashboard-muted">
            Influenced categories
          </p>
          <div className="flex flex-wrap gap-2">
            {topCategories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-primary/25 bg-[#8B5CF6]/10 px-3 py-1 text-xs font-medium text-dashboard-foreground"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-dashboard-muted">
          Browse products, save favorites, and shop to build your influence profile.
        </p>
      )}
    </section>
  );
}
