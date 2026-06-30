'use client';

import { Shirt } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';
import {
  fashionDnaCardHeaderGapClass,
  fashionDnaCardShell,
  fashionDnaCardTitleClass,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

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
    <section className={fashionDnaCardShell(className)}>
      <div className={cn('flex items-center gap-2', fashionDnaCardHeaderGapClass)}>
        <Shirt className="size-4 text-[#8B5CF6]" aria-hidden="true" />
        <h3 className={fashionDnaCardTitleClass}>Wardrobe Balance</h3>
      </div>

      <div className="mb-3 md:mb-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-dashboard-foreground md:text-3xl">{healthScore}</p>
            <p className="text-[11px] text-dashboard-muted md:text-xs">Wardrobe health score</p>
          </div>
          <p className="text-[11px] text-dashboard-muted md:text-sm">
            {wardrobeBalance?.totalItems || 0} tracked items
          </p>
        </div>
        <Progress value={healthScore} className="mt-2 h-2 md:mt-3" />
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 md:px-4 md:py-3"
          >
            <p className="text-[11px] text-dashboard-muted md:text-xs">{row.label}</p>
            <p className="text-lg font-semibold text-dashboard-foreground md:text-xl">{row.count}</p>
          </div>
        ))}
      </div>

      {recommendations.length ? (
        <div className="mt-3 space-y-1.5 md:mt-5 md:space-y-2">
          {recommendations.map((item) => (
            <p key={item} className="text-xs text-dashboard-muted md:text-sm">
              {item}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
