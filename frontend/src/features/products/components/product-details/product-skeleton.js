'use client';

import { PDP_CARD_CLASS } from '../../styles/product-details-tokens';

export function ProductSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-4 w-48 rounded-full bg-white/[0.06]" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className={`${PDP_CARD_CLASS} aspect-[4/5] max-h-[650px] bg-white/[0.04]`} />

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-3 w-24 rounded-full bg-white/[0.06]" />
            <div className="h-10 w-4/5 rounded-2xl bg-white/[0.06]" />
            <div className="h-4 w-32 rounded-full bg-white/[0.06]" />
          </div>

          <div className={`${PDP_CARD_CLASS} space-y-4 p-6`}>
            <div className="h-8 w-40 rounded-xl bg-white/[0.06]" />
            <div className="h-4 w-full rounded-full bg-white/[0.05]" />
            <div className="h-4 w-5/6 rounded-full bg-white/[0.05]" />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-11 rounded-2xl bg-white/[0.05]" />
            ))}
          </div>

          <div className="h-14 rounded-2xl bg-gradient-to-r from-[#8B5CF6]/20 to-[#8B5CF6]/5" />
          <div className="h-14 rounded-2xl bg-white/[0.05]" />
        </div>
      </div>
    </div>
  );
}
