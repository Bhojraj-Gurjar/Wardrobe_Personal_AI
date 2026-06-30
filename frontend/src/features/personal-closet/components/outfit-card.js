'use client';

import { memo, useState } from 'react';
import Image from 'next/image';
import {
  Edit3,
  Eye,
  Loader2,
  Share2,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import { Input } from '@/components/ui/input';
import {
  CLOSET_DELETE_FULL_BUTTON,
  CLOSET_ICON_ACTION,
  CLOSET_REMOVE_BUTTON,
  CLOSET_VIEW_BUTTON,
} from '@/features/personal-closet/components/closet-card-actions';
import {
  deriveOutfitBadges,
  deriveOutfitColorPalette,
  deriveOutfitOccasion,
} from '@/features/personal-closet/utils/closet-insights.util';
import {
  CLOSET_CARD_HOVER,
  CLOSET_GLASS_CARD,
} from '@/features/personal-closet/styles/closet-design-tokens';
import { cn } from '@/utils/cn';

function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function colorToStyle(color) {
  const value = String(color || '').trim();

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    return { backgroundColor: value };
  }

  const map = {
    black: '#111827',
    white: '#F9FAFB',
    olive: '#6B705C',
    dark: '#1F2937',
    'off-white': '#F3F4F6',
    cornflower: '#6495ED',
    navy: '#1E3A8A',
    grey: '#9CA3AF',
    gray: '#9CA3AF',
  };

  return { backgroundColor: map[value.toLowerCase()] || '#6B7280' };
}

export const OutfitCard = memo(function OutfitCard({
  outfit,
  onView,
  onEdit,
  onAddToCart,
  onShare,
  onDelete,
  isAddingToCart,
  isDeleting,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(outfit.name || '');

  const thumbnail = outfit.thumbnailUrl || outfit.previewImageUrl;
  const badges = deriveOutfitBadges(outfit);
  const occasion = deriveOutfitOccasion(outfit);
  const palette = deriveOutfitColorPalette(outfit);

  async function handleSaveName() {
    await onEdit?.(outfit.id, { name: name.trim() || outfit.name });
    setIsEditing(false);
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        CLOSET_GLASS_CARD,
        CLOSET_CARD_HOVER,
        'group overflow-hidden',
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-black/30">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={outfit.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-white/40">
            <div className="size-20 rounded-full border border-dashed border-white/15 bg-white/[0.03]" />
            <span className="text-xs uppercase tracking-[0.18em]">Outfit preview</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#090B18] via-transparent to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-[#7C3AED]/90 px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg">
            AI {badges.matchScore}%
          </span>
          {badges.isLuxury ? (
            <span className="rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-semibold text-white">
              Luxury
            </span>
          ) : null}
          {badges.isTrending ? (
            <span className="rounded-full bg-emerald-500/85 px-2.5 py-1 text-[10px] font-semibold text-white">
              Trending
            </span>
          ) : null}
          {badges.isNew ? (
            <span className="rounded-full bg-sky-500/85 px-2.5 py-1 text-[10px] font-semibold text-white">
              New
            </span>
          ) : null}
          <span className="rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur">
            {badges.season}
          </span>
        </div>

        <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white/75 backdrop-blur">
          {outfit.source?.replace(/-/g, ' ') || 'saved'}
        </span>
      </div>

      <div className="space-y-4 p-4">
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-9 border-white/[0.08] bg-black/20 text-white"
            />
            <button
              type="button"
              className={cn(CLOSET_VIEW_BUTTON, 'w-auto px-3')}
              onClick={handleSaveName}
            >
              Save
            </button>
          </div>
        ) : (
          <h3 className="line-clamp-1 text-base font-semibold text-white">
            {outfit.name}
          </h3>
        )}

        <div className="grid grid-cols-2 gap-2 text-[11px] text-white/45">
          <div>
            <p className="uppercase tracking-wide">Created</p>
            <p className="mt-0.5 font-medium text-white/80">{formatDate(outfit.createdAt)}</p>
          </div>
          <div>
            <p className="uppercase tracking-wide">Items</p>
            <p className="mt-0.5 font-medium text-white/80">
              {outfit.productCount || outfit.items?.length || 0}
            </p>
          </div>
          <div>
            <p className="uppercase tracking-wide">Value</p>
            <p className="mt-0.5 font-medium text-[#C4B5FD]">
              {formatProductPrice(outfit.totalPrice)}
            </p>
          </div>
          <div>
            <p className="uppercase tracking-wide">Occasion</p>
            <p className="mt-0.5 font-medium text-white/80">{occasion}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-white/40">Palette</span>
          <div className="flex -space-x-1">
            {palette.map((color, index) => (
              <span
                key={`${color}-${index}`}
                className="size-5 rounded-full border-2 border-[#141B2D] shadow-sm"
                style={colorToStyle(color)}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className={CLOSET_VIEW_BUTTON}
            aria-label={`View ${outfit.name}`}
            title="View"
            onClick={() => onView?.(outfit)}
          >
            <Eye className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={CLOSET_ICON_ACTION}
            aria-label={`Edit ${outfit.name}`}
            title="Edit"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={CLOSET_ICON_ACTION}
            aria-label={`Share ${outfit.name}`}
            title="Share"
            onClick={() => onShare?.(outfit)}
          >
            <Share2 className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={CLOSET_ICON_ACTION}
            aria-label={`Add ${outfit.name} to cart`}
            title="Add to Cart"
            disabled={isAddingToCart}
            onClick={() => onAddToCart?.(outfit)}
          >
            {isAddingToCart ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ShoppingCart className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <button
          type="button"
          className={CLOSET_DELETE_FULL_BUTTON}
          aria-label={`Delete ${outfit.name}`}
          disabled={isDeleting}
          onClick={() => onDelete?.(outfit)}
        >
          {isDeleting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-4" aria-hidden="true" />
          )}
          Delete Outfit
        </button>
      </div>
    </motion.article>
  );
});

OutfitCard.displayName = 'OutfitCard';
