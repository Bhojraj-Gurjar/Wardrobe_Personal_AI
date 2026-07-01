'use client';

import { memo, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Eye, Heart, Loader2, Plus, ShoppingBag } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ProductCardImage } from '@/features/products/components/product-card-image';
import {
  deriveProductBadges,
  formatProductPrice,
  getProductImageUrl,
  isProductComingSoon,
} from '@/features/products/utils/product-catalog.utils';
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useWishlistQuery,
} from '@/features/wishlist/hooks';
import { useAddCartItemMutation } from '@/features/cart/hooks';
import { cn } from '@/utils/cn';

const BADGE_TONE_CLASS = {
  purple: 'bg-primary/90 text-primary-foreground',
  teal: 'bg-dashboard-success/90 text-primary-foreground',
  orange: 'bg-dashboard-warning/90 text-primary-foreground',
  sale: 'bg-destructive/90 text-primary-foreground',
};

function resolveCompareAtPrice(product) {
  return product?.compareAtPrice
    ?? product?.compare_at_price
    ?? (Number(product?.mrp) > Number(product?.price) ? product.mrp : null);
}

function resolveDiscountPercent(product, priceValue, compareValue) {
  if (!priceValue || !compareValue || compareValue <= priceValue) {
    return null;
  }

  return Math.round(((compareValue - priceValue) / compareValue) * 100);
}

function TodaysPicksProductCard({
  product,
  matchPercent,
  href,
  isMock = false,
  className,
}) {
  const [cartAdded, setCartAdded] = useState(false);
  const { data: wishlistData } = useWishlistQuery();
  const addToWishlist = useAddToWishlistMutation();
  const removeFromWishlist = useRemoveFromWishlistMutation();
  const addToCart = useAddCartItemMutation();

  const name = product?.name || 'Recommended pick';
  const image = getProductImageUrl(product);
  const comingSoon = isProductComingSoon(product);
  const productHref = href || (product?.id ? ROUTES.PRODUCTS.DETAIL(product.id) : ROUTES.AI.RECOMMENDATIONS);

  const wishlistItem = useMemo(
    () => wishlistData?.items?.find((item) => item.product_id === product?.id),
    [product?.id, wishlistData?.items],
  );
  const isWishlisted = Boolean(wishlistItem);

  const price = formatProductPrice(product?.price, product?.currency);
  const compareAtPrice = formatProductPrice(resolveCompareAtPrice(product), product?.currency);
  const hasDiscount = Boolean(compareAtPrice && compareAtPrice !== price);
  const discountPercent = resolveDiscountPercent(
    product,
    Number(product?.price),
    Number(resolveCompareAtPrice(product)),
  );
  const saleBadge = deriveProductBadges(product).find((badge) => badge.id === 'sale');

  const isWishlistPending = addToWishlist.isPending || removeFromWishlist.isPending;
  const isCartPending = addToCart.isPending;

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
          setCartAdded(true);
          window.setTimeout(() => setCartAdded(false), 1500);
        },
      },
    );
  }

  return (
    <article
      className={cn(
        'group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[18px]',
        'border border-dashboard-border bg-dashboard-surface p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)]',
        'transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30',
        'hover:shadow-[0_16px_40px_rgba(124,58,237,0.16)]',
        className,
      )}
      {...(isMock ? { 'data-mock': 'true' } : {})}
    >
      <div className="relative min-h-0 flex-[0_0_62%] overflow-hidden rounded-xl bg-dashboard-surface-elevated">
        <Link href={productHref} prefetch className="block size-full">
          <ProductCardImage
            src={image}
            alt={name}
            sizes="(max-width: 640px) 42vw, (max-width: 1024px) 20vw, 16vw"
            imageClassName="size-full object-contain p-2 transition-transform duration-300 motion-safe:group-hover:scale-[1.02]"
          />
        </Link>

        <span className="absolute left-2 top-2 z-10 rounded-full bg-dashboard-success/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
          {matchPercent}% Match
        </span>

        <button
          type="button"
          className={cn(
            'absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full',
            'border border-dashboard-border/80 bg-dashboard-bg/85 text-dashboard-muted backdrop-blur',
            'transition-all duration-200 hover:text-dashboard-foreground',
            isWishlisted && 'border-primary/40 text-primary',
          )}
          aria-label={isWishlisted ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
          aria-pressed={isWishlisted}
          disabled={isWishlistPending}
          onClick={handleWishlistClick}
        >
          {isWishlistPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Heart className={cn('size-3.5', isWishlisted && 'fill-primary')} />
          )}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col pt-3">
        {product?.brand ? (
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-dashboard-muted">
            {product.brand}
          </p>
        ) : null}

        <Link href={productHref} prefetch className="mt-1 block min-h-0">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-dashboard-foreground transition-colors group-hover:text-primary">
            {name}
          </h3>
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {price ? (
            <span className="text-sm font-bold text-dashboard-foreground">{price}</span>
          ) : null}
          {hasDiscount ? (
            <span className="text-xs text-dashboard-muted line-through">{compareAtPrice}</span>
          ) : null}
          {discountPercent ? (
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-red-300">
              -{discountPercent}%
            </span>
          ) : null}
          {saleBadge ? (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                BADGE_TONE_CLASS[saleBadge.tone] || BADGE_TONE_CLASS.sale,
              )}
            >
              {saleBadge.label}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-auto flex shrink-0 items-center gap-2 border-t border-dashboard-border/60 pt-3">
        <Link
          href={productHref}
          prefetch
          className={cn(
            'inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl',
            'border border-dashboard-border bg-dashboard-bg/50 px-3 py-2 text-xs font-semibold text-dashboard-foreground',
            'transition-all duration-200 hover:border-primary/30 hover:bg-white/[0.04]',
          )}
        >
          <Eye className="size-3.5 shrink-0" aria-hidden="true" />
          Quick View
        </Link>

        <button
          type="button"
          disabled={isCartPending || cartAdded || comingSoon || !product?.id}
          onClick={handleAddToCartClick}
          className={cn(
            'inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2',
            'text-xs font-semibold text-primary-foreground transition-all duration-200',
            comingSoon && 'cursor-not-allowed bg-dashboard-border text-dashboard-muted',
            !comingSoon && cartAdded && 'bg-dashboard-success',
            !comingSoon && !cartAdded && 'bg-primary hover:brightness-110',
          )}
          aria-label={
            comingSoon
              ? `${name} is coming soon`
              : cartAdded
                ? `${name} added to cart`
                : `Add ${name} to cart`
          }
        >
          {isCartPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : cartAdded ? (
            <Check className="size-3.5" />
          ) : comingSoon ? (
            <ShoppingBag className="size-3.5" />
          ) : (
            <Plus className="size-3.5" />
          )}
          {comingSoon ? 'View Product' : cartAdded ? 'Added' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}

export const DashboardProductCard = memo(function DashboardProductCard({
  name,
  image,
  matchPercent,
  href,
  product,
  isMock = false,
  variant = 'default',
  className,
}) {
  const isPicks = variant === 'picks';

  if (isPicks && product) {
    return (
      <TodaysPicksProductCard
        product={product}
        matchPercent={matchPercent}
        href={href}
        isMock={isMock}
        className={className}
      />
    );
  }

  return (
    <Link
      href={href}
      prefetch
      className={cn(
        'group relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl',
        'interactive-card cursor-pointer border border-dashboard-border bg-dashboard-surface',
        'transition-[border-color,box-shadow] duration-200',
        'hover:border-primary/30 hover:shadow-[0_12px_32px_rgba(139,92,246,0.12)]',
        'md:rounded-2xl',
        className,
      )}
      {...(isMock ? { 'data-mock': 'true' } : {})}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-dashboard-surface-elevated">
        <ProductCardImage
          src={image}
          alt={name}
          sizes="(max-width: 640px) 42vw, (max-width: 1024px) 20vw, 16vw"
          imageClassName="size-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
        />
        <span
          className={cn(
            'absolute left-2 top-2 z-10 rounded-full px-1.5 py-0.5 text-[9px] font-semibold md:left-3 md:top-3 md:px-2.5 md:py-1 md:text-xs',
            'bg-dashboard-success/90 text-primary-foreground shadow-sm',
          )}
        >
          {matchPercent}% Match
        </span>
      </div>
      {name ? (
        <p className="line-clamp-2 min-h-[2.5rem] flex-1 px-2 py-2 text-[11px] font-medium leading-snug text-dashboard-foreground md:min-h-[2.75rem] md:px-3 md:py-2.5 md:text-xs">
          {name}
        </p>
      ) : null}
    </Link>
  );
});
