'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Eye, Heart, Loader2, Plus, Star } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ProductCardImage } from '@/features/products/components/product-card-image';
import {
  deriveProductBadges,
  formatProductPrice,
  getProductImageUrl,
  isProductComingSoon,
  normalizeMatchScore,
} from '@/features/products/utils/product-catalog.utils';
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useWishlistQuery,
} from '@/features/wishlist/hooks';
import { useAddCartItemMutation } from '@/features/cart/hooks';
import { cn } from '@/utils/cn';

const BADGE_STYLES = {
  purple: 'bg-primary/90 text-primary-foreground',
  teal: 'bg-dashboard-success/90 text-primary-foreground',
  orange: 'bg-dashboard-warning/90 text-primary-foreground',
  sale: 'bg-destructive/90 text-destructive-foreground',
};

export function ProductCatalogCard({
  product,
  matchScore,
  isBestMatch = false,
  compact = false,
  recommendationReason = null,
  featureBadge = null,
  showQuickView = false,
  className,
}) {
  const [cartAdded, setCartAdded] = useState(false);
  const { data: wishlistData } = useWishlistQuery();
  const addToWishlist = useAddToWishlistMutation();
  const removeFromWishlist = useRemoveFromWishlistMutation();
  const addToCart = useAddCartItemMutation();

  const wishlistItem = useMemo(
    () => wishlistData?.items?.find((item) => item.product_id === product.id),
    [wishlistData?.items, product.id],
  );
  const isWishlisted = Boolean(wishlistItem);

  const imageUrl = getProductImageUrl(product);
  const comingSoon = isProductComingSoon(product);
  const badges = deriveProductBadges(product, { isBestMatch });
  const topBadge = comingSoon ? null : (featureBadge || badges[0]);
  const matchPercent = normalizeMatchScore(matchScore);
  const price = formatProductPrice(product?.price, product?.currency);
  const compareAtPrice = formatProductPrice(
    product?.compareAtPrice
      ?? product?.compare_at_price
      ?? (Number(product?.mrp) > Number(product?.price) ? product.mrp : null),
    product?.currency,
  );
  const rating = product?.rating ?? product?.average_rating ?? null;
  const reviewCount = product?.reviewCount ?? product?.review_count ?? null;

  const isWishlistPending =
    addToWishlist.isPending || removeFromWishlist.isPending;
  const isCartPending = addToCart.isPending;
  const productHref = product?.id ? ROUTES.PRODUCTS.DETAIL(product.id) : ROUTES.PRODUCTS.LIST;

  function handleWishlistClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (isWishlistPending || !product?.id) {
      return;
    }

    if (isWishlisted && wishlistItem?.id) {
      removeFromWishlist.mutate(wishlistItem.id);
      return;
    }

    addToWishlist.mutate(product.id);
  }

  function handleAddToCartClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (isCartPending || !product?.id || comingSoon) {
      return;
    }

    addToCart.mutate(
      { productId: product.id },
      {
        onSuccess: () => {
          if (isWishlisted && wishlistItem?.id) {
            removeFromWishlist.mutate(wishlistItem.id);
          }
          setCartAdded(true);
          window.setTimeout(() => setCartAdded(false), 1500);
        },
      },
    );
  }

  return (
    <article
      className={cn(
        'group interactive-card cursor-pointer overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface',
        'transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10',
        compact ? 'flex gap-3 p-3' : 'flex flex-col',
        className,
      )}
    >
      <Link
        href={productHref}
        className={cn(
          'relative block overflow-hidden bg-dashboard-surface-elevated',
          compact ? 'h-28 w-24 shrink-0 rounded-xl' : 'aspect-[3/4] w-full',
        )}
      >
        <ProductCardImage
          src={imageUrl}
          alt={product.name}
          sizes={compact ? '96px' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'}
          imageClassName="transition-transform duration-300 group-hover:scale-105"
        />

        {topBadge ? (
          <span
            className={cn(
              'absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-semibold',
              BADGE_STYLES[topBadge.tone] || BADGE_STYLES.purple,
            )}
          >
            {topBadge.label}
          </span>
        ) : null}

        {comingSoon ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#070B1A]/50 backdrop-blur-[1px]">
            <span className="rounded-full border border-violet-300/40 bg-gradient-to-r from-violet-600/95 to-purple-500/95 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_0_28px_rgba(124,58,237,0.45)]">
              Coming Soon
            </span>
          </div>
        ) : null}

        {matchPercent != null ? (
          <span className="absolute bottom-3 left-3 z-10 rounded-full bg-dashboard-success/90 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
            {matchPercent}% match
          </span>
        ) : null}

        {showQuickView && !comingSoon ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#070B1A]/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/95 px-4 py-2 text-xs font-semibold text-[#111827] shadow-lg">
              <Eye className="size-3.5" aria-hidden="true" />
              Quick View
            </span>
          </div>
        ) : null}
      </Link>

      <div className={cn('flex flex-1 flex-col', compact ? 'min-w-0 py-1' : 'p-4')}>
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            {product.brand ? (
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-dashboard-muted">
                {product.brand}
                {product.productType || product.product_type
                  ? ` · ${product.productType || product.product_type}`
                  : ''}
              </p>
            ) : null}
            <Link href={productHref} className="block">
              <h3 className="line-clamp-2 text-sm font-semibold text-dashboard-foreground transition-colors group-hover:text-primary">
                {product.name}
              </h3>
            </Link>
            {recommendationReason ? (
              <p className="mt-1 line-clamp-2 text-xs text-violet-300/90">
                {recommendationReason}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full',
              'border border-dashboard-border bg-dashboard-bg/70 transition-all duration-200',
              isWishlisted
                ? 'border-primary/40 text-primary hover:scale-105 hover:shadow-md'
                : 'text-dashboard-muted hover:scale-105 hover:border-primary/40 hover:text-primary hover:shadow-md',
            )}
            aria-label={
              isWishlisted
                ? `Remove ${product.name} from wishlist`
                : `Save ${product.name} to wishlist`
            }
            aria-pressed={isWishlisted}
            disabled={isWishlistPending}
            onClick={handleWishlistClick}
          >
            {isWishlistPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Heart className={cn('size-4', isWishlisted && 'fill-primary')} />
            )}
          </button>
        </div>

        {rating != null ? (
          <div className="mb-2 flex items-center gap-1 text-xs text-dashboard-muted">
            <Star className="size-3.5 fill-dashboard-warning text-dashboard-warning" />
            <span className="font-medium text-dashboard-foreground">{rating}</span>
            {reviewCount != null ? <span>({reviewCount})</span> : null}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-2">
            {price ? (
              <span className="text-base font-bold text-dashboard-foreground">{price}</span>
            ) : null}
            {compareAtPrice && compareAtPrice !== price ? (
              <span className="text-sm text-dashboard-muted line-through">{compareAtPrice}</span>
            ) : null}
          </div>

          <button
            type="button"
            className={cn(
              'flex size-9 items-center justify-center rounded-full text-primary-foreground transition-all duration-200',
              comingSoon && 'cursor-not-allowed bg-dashboard-border text-dashboard-muted opacity-70',
              !comingSoon && cartAdded && 'bg-dashboard-success',
              !comingSoon && !cartAdded && 'bg-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/30',
            )}
            aria-label={
              comingSoon
                ? `${product.name} is coming soon`
                : cartAdded
                  ? `${product.name} added to cart`
                  : `Add ${product.name} to cart`
            }
            disabled={isCartPending || cartAdded || comingSoon}
            onClick={handleAddToCartClick}
          >
            {isCartPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : cartAdded ? (
              <Check className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
