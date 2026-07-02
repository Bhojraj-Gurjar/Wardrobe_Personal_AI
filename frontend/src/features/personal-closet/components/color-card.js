'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CLOSET_GLASS_CARD } from '@/features/personal-closet/styles/closet-design-tokens';
import { cn } from '@/utils/cn';

export function ColorCard({ color, onRemove, isRemoving, outfitCount = 0 }) {
  const productEstimate = Math.max(1, Math.round((color.usagePercent || 0) / 8));
  const seasonTag = ['black', 'dark', 'navy'].includes(color.colorName?.toLowerCase())
    ? 'Winter'
    : ['olive', 'cornflower'].includes(color.colorName?.toLowerCase())
      ? 'Spring'
      : 'All Season';

  return (
    <motion.article
      whileHover={{ y: -3, scale: 1.01 }}
      className={cn(
        CLOSET_GLASS_CARD,
        'group overflow-hidden p-4 transition hover:border-[#7C3AED]/35 hover:shadow-[0_12px_36px_rgba(124,58,237,0.15)]',
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <span
            className="block size-16 rounded-full border-2 border-white/15 shadow-[0_0_30px_rgba(124,58,237,0.25)] transition group-hover:scale-105"
            style={{ backgroundColor: color.hexCode }}
            aria-hidden="true"
          />
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-mono text-white/70">
            {color.hexCode}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-white">{color.colorName}</h3>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
              {seasonTag}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/45">{color.usagePercent}% of your palette</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"
              style={{ width: `${Math.min(100, color.usagePercent || 0)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-white/35">
            ~{productEstimate} products · {outfitCount} outfits
          </p>
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="rounded-xl text-red-300 hover:bg-red-500/10"
          disabled={isRemoving}
          onClick={() => onRemove(color)}
        >
          Remove
        </Button>
      </div>
    </motion.article>
  );
}
