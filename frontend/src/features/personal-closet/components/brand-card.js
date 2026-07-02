'use client';

import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  CLOSET_CARD_HOVER,
  CLOSET_GLASS_CARD,
} from '@/features/personal-closet/styles/closet-design-tokens';
import { cn } from '@/utils/cn';

export function BrandCard({ brand, onBrowse, onRemove, isRemoving }) {
  const initials = brand.brandName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const compatibility = Math.min(98, 62 + (brand.interactionCount || 0) * 3);
  const purchasedEstimate = Math.max(1, Math.round((brand.interactionCount || 1) * 0.45));
  const wishlistEstimate = Math.max(0, (brand.interactionCount || 0) - purchasedEstimate);

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        CLOSET_GLASS_CARD,
        CLOSET_CARD_HOVER,
        'overflow-hidden p-4',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED]/25 to-[#A855F7]/10 text-sm font-bold text-white shadow-[0_0_24px_rgba(124,58,237,0.2)]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-white">{brand.brandName}</h3>
            {(brand.interactionCount || 0) >= 8 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                <Crown className="size-3" aria-hidden="true" />
                Luxury
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-white/45">
            {brand.interactionCount} interactions · {brand.preferredCategory}
          </p>
          <p className="mt-1 text-[11px] text-white/35">
            {purchasedEstimate} purchased · {wishlistEstimate} wishlist
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-white/45">
          <span>AI Compatibility</span>
          <span className="font-semibold text-[#C4B5FD]">{compatibility}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"
            style={{ width: `${compatibility}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          className="flex-1 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white hover:brightness-110"
          onClick={() => onBrowse(brand)}
        >
          Browse
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-xl text-red-300 hover:bg-red-500/10"
          disabled={isRemoving}
          onClick={() => onRemove(brand)}
        >
          Remove
        </Button>
      </div>
    </motion.article>
  );
}
