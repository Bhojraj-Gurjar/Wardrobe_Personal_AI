'use client';

import { Shirt } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';

const SLOT_LABELS = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  footwear: 'Footwear',
  outerwear: 'Outerwear',
  other: 'Other',
};

export function WardrobeBalanceCard({ wardrobeBalance, className }) {
  const counts = wardrobeBalance?.counts || {};
  const recommendations = wardrobeBalance?.recommendations || [];
  const healthScore = Number(wardrobeBalance?.healthScore) || 0;

  const rows = Object.entries(SLOT_LABELS).map(([key, label]) => ({
    key,
    label,
    count: Number(counts[key]) || 0,
  }));

  return (
    <section
      className={cn(
        'rounded-[24px] border border-dashboard-border bg-[#1A2235] p-6 shadow-lg',
        className,
      )}
    >
      <div className="mb-5 flex items-center gap-2">
        <Shirt className="size-4 text-[#8B5CF6]" aria-hidden="true" />
        <h3 className="text-base font-semibold text-dashboard-foreground">
          Wardrobe Balance
        </h3>
      </div>

      <div className="mb-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-dashboard-foreground">{healthScore}</p>
            <p className="text-xs text-dashboard-muted">Wardrobe health score</p>
          </div>
          <p className="text-sm text-dashboard-muted">
            {wardrobeBalance?.totalItems || 0} tracked items
          </p>
        </div>
        <Progress value={healthScore} className="mt-3 h-2" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
          >
            <p className="text-xs text-dashboard-muted">{row.label}</p>
            <p className="text-xl font-semibold text-dashboard-foreground">{row.count}</p>
          </div>
        ))}
      </div>

      {recommendations.length ? (
        <div className="mt-5 space-y-2">
          {recommendations.map((item) => (
            <p key={item} className="text-sm text-dashboard-muted">
              {item}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
