'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Check,
  Copy,
  Heart,
  Loader2,
  Share2,
  ShoppingCart,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useWishlistQuery,
} from '@/features/wishlist/hooks';
import { useAddCartItemMutation } from '@/features/cart/hooks';
import { cn } from '@/utils/cn';
import { isProductInStock } from '../../utils/product-details.utils';

function ActionToast({ message, tone = 'success' }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-2xl px-4 py-3 text-sm font-medium',
        tone === 'success' && 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/20',
        tone === 'error' && 'bg-red-500/15 text-red-200 ring-1 ring-red-500/20',
      )}
      role="status"
    >
      {message}
    </div>
  );
}

export function PurchaseActions({
  product,
  quantity,
  compact = false,
  className,
}) {
  const router = useRouter();
  const [cartAdded, setCartAdded] = useState(false);
  const [toast, setToast] = useState('');

  const { data: wishlistData } = useWishlistQuery();
  const addToWishlist = useAddToWishlistMutation();
  const removeFromWishlist = useRemoveFromWishlistMutation();
  const addToCart = useAddCartItemMutation();

  const wishlistItem = useMemo(
    () => wishlistData?.items?.find((item) => item.product_id === product?.id),
    [wishlistData?.items, product?.id],
  );
  const isWishlisted = Boolean(wishlistItem);
  const inStock = isProductInStock(product);

  const isWishlistPending = addToWishlist.isPending || removeFromWishlist.isPending;
  const isCartPending = addToCart.isPending;

  function showToast(message, tone = 'success') {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  }

  function handleWishlist() {
    if (!product?.id || isWishlistPending) {
      return;
    }

    if (isWishlisted && wishlistItem?.id) {
      removeFromWishlist.mutate(wishlistItem.id, {
        onSuccess: () => showToast('Removed from wishlist'),
      });
      return;
    }

    addToWishlist.mutate(product.id, {
      onSuccess: () => showToast('Saved to wishlist'),
    });
  }

  function handleAddToCart({ redirectToCheckout = false } = {}) {
    if (!product?.id || isCartPending || !inStock) {
      return;
    }

    addToCart.mutate(
      { productId: product.id, quantity },
      {
        onSuccess: () => {
          if (isWishlisted && wishlistItem?.id) {
            removeFromWishlist.mutate(wishlistItem.id);
          }

          setCartAdded(true);
          showToast(redirectToCheckout ? 'Added — opening checkout' : 'Added to cart');

          window.setTimeout(() => {
            setCartAdded(false);
            if (redirectToCheckout) {
              router.push(`${ROUTES.CART}?checkout=1`);
            }
          }, redirectToCheckout ? 500 : 1500);
        },
        onError: (error) => {
          showToast(error?.message || 'Could not add to cart', 'error');
        },
      },
    );
  }

  async function handleShare() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: product?.name, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard');
    } catch {
      showToast('Could not share product', 'error');
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard');
    } catch {
      showToast('Could not copy link', 'error');
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <ActionToast message={toast} />

      <button
        type="button"
        disabled={!inStock || isCartPending}
        onClick={() => handleAddToCart({ redirectToCheckout: true })}
        className={cn(
          'group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] px-5 py-4 text-base font-semibold text-white shadow-[0_16px_40px_rgba(139,92,246,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(139,92,246,0.45)] disabled:cursor-not-allowed disabled:opacity-50',
          compact && 'py-3.5 text-sm',
        )}
      >
        {isCartPending ? <Loader2 className="size-5 animate-spin" /> : null}
        Buy Now
        <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />
      </button>

      <button
        type="button"
        disabled={!inStock || isCartPending || cartAdded}
        onClick={() => handleAddToCart()}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.03] px-5 py-4 text-base font-semibold text-white transition hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/10 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] disabled:cursor-not-allowed disabled:opacity-50',
          cartAdded && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
          compact && 'py-3.5 text-sm',
        )}
      >
        {isCartPending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : cartAdded ? (
          <Check className="size-5" />
        ) : (
          <ShoppingCart className="size-5" />
        )}
        {cartAdded ? 'Added to Cart' : 'Add to Cart'}
      </button>

      {!compact ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleWishlist}
            disabled={isWishlistPending}
            aria-pressed={isWishlisted}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[0.08] px-4 py-3 text-sm font-medium text-white/75 transition hover:border-[#8B5CF6]/35 hover:text-white',
              isWishlisted && 'border-[#8B5CF6]/40 text-[#C4B5FD]',
            )}
          >
            {isWishlistPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Heart className={cn('size-4', isWishlisted && 'fill-[#8B5CF6] text-[#8B5CF6]')} />
            )}
            Wishlist
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] px-4 py-3 text-sm font-medium text-white/75 transition hover:border-[#8B5CF6]/35 hover:text-white"
          >
            <Share2 className="size-4" />
            Share
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] px-4 py-3 text-sm font-medium text-white/75 transition hover:border-[#8B5CF6]/35 hover:text-white"
          >
            <Copy className="size-4" />
            Copy Link
          </button>
        </div>
      ) : null}
    </div>
  );
}
