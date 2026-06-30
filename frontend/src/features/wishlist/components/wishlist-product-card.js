'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, ShoppingBag, Star, Trash2 } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ProductCardImage } from '@/features/products/components/product-card-image';
import {
  formatProductPrice,
  getProductImageUrl,
  normalizeMatchScore,
} from '@/features/products/utils/product-catalog.utils';
import { useAddCartItemMutation } from '@/features/cart/hooks';
import { useRemoveFromWishlistMutation } from '@/features/wishlist/hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function WishlistProductCard({
  item,
  matchScore,
  onRemove,
  isRemoving = false,
  className,
}) {
  const [cartAdded, setCartAdded] = useState(false);
  const addToCart = useAddCartItemMutation();
  const removeFromWishlist = useRemoveFromWishlistMutation();

  const product = item.product;
  const imageUrl = getProductImageUrl(product);
  const matchPercent = normalizeMatchScore(matchScore);
  const price = formatProductPrice(product?.price, product?.currency);
  const compareAtPrice = formatProductPrice(
    product?.compareAtPrice ?? product?.compare_at_price,
    product?.currency,
  );
  const rating = product?.rating ?? product?.average_rating ?? null;
  const isOutOfStock = product?.isActive === false;
  const isCartPending = addToCart.isPending || removeFromWishlist.isPending;

  function handleAddToCart() {
    if (isOutOfStock || isCartPending || !product?.id) {
      return;
    }

    addToCart.mutate(
      { productId: product.id },
      {
        onSuccess: () => {
          removeFromWishlist.mutate(item.id, {
            onSuccess: () => {
              setCartAdded(true);
            },
          });
        },
      },
    );
  }

  function handleRemove(event) {
    event.preventDefault();
    event.stopPropagation();

    if (isRemoving) {
      return;
    }

    onRemove?.(item.id);
  }

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface interactive-card cursor-pointer',
        className,
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-dashboard-surface-elevated">
        <Link href={ROUTES.PRODUCTS.DETAIL(product.id)} className="block size-full">
          <ProductCardImage
            src={imageUrl}
            alt={product.name}
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 16vw"
            imageClassName={cn(
              'transition-transform duration-300 hover:scale-105',
              isOutOfStock && 'opacity-60',
            )}
          />
        </Link>

        <button
          type="button"
          className={cn(
            'absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full',
            'border border-dashboard-border/80 bg-dashboard-bg/90 text-dashboard-muted',
            'transition-all duration-200 hover:scale-105 hover:border-destructive/40 hover:text-destructive hover:shadow-md',
          )}
          aria-label={`Remove ${product.name} from wishlist`}
          disabled={isRemoving}
          onClick={handleRemove}
        >
          {isRemoving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </button>

        {matchPercent != null ? (
          <span className="absolute bottom-3 left-3 z-10 rounded-full bg-dashboard-success/90 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
            {matchPercent}% match
          </span>
        ) : null}

        {isOutOfStock ? (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-dashboard-bg/20">
            <span className="rounded-full bg-destructive/90 px-3 py-1.5 text-xs font-semibold text-destructive-foreground">
              Out of Stock
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 min-w-0 space-y-1">
          {product.brand ? (
            <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-dashboard-muted">
              {product.brand}
            </p>
          ) : null}

          <Link href={ROUTES.PRODUCTS.DETAIL(product.id)}>
            <h3 className="line-clamp-2 text-sm font-semibold text-dashboard-foreground transition-colors hover:text-primary">
              {product.name}
            </h3>
          </Link>

          {rating != null ? (
            <div className="flex items-center gap-1 pt-1 text-xs text-dashboard-muted">
              <Star className="size-3.5 fill-dashboard-warning text-dashboard-warning" />
              <span className="font-medium text-dashboard-foreground">{rating}</span>
            </div>
          ) : null}

          <div className="flex items-baseline gap-2 pt-1">
            {price ? (
              <span className="text-base font-bold text-dashboard-foreground">{price}</span>
            ) : null}
            {compareAtPrice && compareAtPrice !== price ? (
              <span className="text-sm text-dashboard-muted line-through">{compareAtPrice}</span>
            ) : null}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className={cn(
            'mt-auto w-full rounded-xl border-primary/40 bg-transparent text-primary',
            'hover:border-primary hover:bg-primary/10 hover:text-primary',
            cartAdded && 'border-dashboard-success/40 text-dashboard-success hover:bg-dashboard-success/10',
          )}
          disabled={isOutOfStock || isCartPending || cartAdded}
          onClick={handleAddToCart}
        >
          {isCartPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : cartAdded ? (
            <>
              <Check className="size-4" />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingBag className="size-4" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    </article>
  );
}
