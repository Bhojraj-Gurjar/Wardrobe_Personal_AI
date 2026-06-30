'use client';

import { memo } from 'react';
import Image from 'next/image';
import {
  ExternalLink,
  Heart,
  Layers,
  Loader2,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import {
  CLOSET_ICON_ACTION,
  CLOSET_REMOVE_BUTTON,
  CLOSET_VIEW_BUTTON,
} from '@/features/personal-closet/components/closet-card-actions';
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

export const PurchasedItemCard = memo(function PurchasedItemCard({
  item,
  onView,
  onWishlist,
  onAddToOutfit,
  onRemove,
  isWishlisting,
  isRemoving,
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        CLOSET_GLASS_CARD,
        CLOSET_CARD_HOVER,
        'group overflow-hidden',
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-black/30">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/40">
            No image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090B18]/80 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur">
          {item.category || 'Wardrobe'}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A855F7]">
            {item.brand}
          </p>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
            {item.name}
          </h3>
          <p className="line-clamp-1 text-[11px] text-white/45">
            {item.category} · {item.size} · {item.color}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#C4B5FD]">
            {formatProductPrice(item.price, item.currency)}
          </span>
          <span className="text-[10px] text-white/40">
            {formatDate(item.purchasedAt)}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            className={CLOSET_VIEW_BUTTON}
            aria-label={`View ${item.name}`}
            title="View"
            onClick={() => onView?.(item)}
          >
            <ExternalLink className="size-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={CLOSET_REMOVE_BUTTON}
            aria-label={`Remove ${item.name} from closet`}
            title="Remove"
            disabled={isRemoving}
            onClick={() => onRemove?.(item)}
          >
            {isRemoving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            className={CLOSET_ICON_ACTION}
            aria-label={`Add ${item.name} to wishlist`}
            title="Wishlist"
            disabled={isWishlisting}
            onClick={() => onWishlist?.(item)}
          >
            {isWishlisting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Heart className="size-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            className={CLOSET_ICON_ACTION}
            aria-label={`Try on ${item.name}`}
            title="Try On"
            onClick={() => onAddToOutfit?.(item)}
          >
            <Layers className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.article>
  );
});

PurchasedItemCard.displayName = 'PurchasedItemCard';

export function getProductDetailRoute(productId) {
  return ROUTES.PRODUCTS.DETAIL(productId);
}
