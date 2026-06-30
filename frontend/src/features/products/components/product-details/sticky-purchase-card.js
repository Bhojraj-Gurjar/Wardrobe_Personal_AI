'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Heart, Loader2, ShoppingCart } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useWishlistQuery,
} from '@/features/wishlist/hooks';
import { useAddCartItemMutation } from '@/features/cart/hooks';
import { cn } from '@/utils/cn';
import { formatProductPrice } from '../../utils/product-catalog.utils';
import { isProductInStock } from '../../utils/product-details.utils';
import { PDP_GLASS_CLASS } from '../../styles/product-details-tokens';

export function MobilePurchaseBar({ product, quantity }) {
  const router = useRouter();
  const [cartAdded, setCartAdded] = useState(false);
  const { data: wishlistData } = useWishlistQuery();
  const addToWishlist = useAddToWishlistMutation();
  const removeFromWishlist = useRemoveFromWishlistMutation();
  const addToCart = useAddCartItemMutation();

  const price = useMemo(
    () => formatProductPrice(product?.price, product?.currency),
    [product?.price, product?.currency],
  );

  const wishlistItem = useMemo(
    () => wishlistData?.items?.find((item) => item.product_id === product?.id),
    [wishlistData?.items, product?.id],
  );
  const isWishlisted = Boolean(wishlistItem);
  const inStock = isProductInStock(product);
  const isCartPending = addToCart.isPending;

  function handleWishlist() {
    if (!product?.id) return;
    if (isWishlisted && wishlistItem?.id) {
      removeFromWishlist.mutate(wishlistItem.id);
      return;
    }
    addToWishlist.mutate(product.id);
  }

  function handleAddToCart(redirectToCheckout = false) {
    if (!product?.id || !inStock) return;

    addToCart.mutate(
      { productId: product.id, quantity },
      {
        onSuccess: () => {
          setCartAdded(true);
          window.setTimeout(() => {
            setCartAdded(false);
            if (redirectToCheckout) {
              router.push(`${ROUTES.CART}?checkout=1`);
            }
          }, redirectToCheckout ? 400 : 1200);
        },
      },
    );
  }

  return (
    <div className={`${PDP_GLASS_CLASS} fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{product?.name}</p>
          <p className="text-base font-bold text-[#C4B5FD]">{price}</p>
        </div>
        <button
          type="button"
          onClick={handleWishlist}
          aria-pressed={isWishlisted}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={cn(
            'flex size-11 items-center justify-center rounded-2xl border border-white/[0.08] text-white/70',
            isWishlisted && 'border-[#8B5CF6]/40 text-[#C4B5FD]',
          )}
        >
          <Heart className={cn('size-5', isWishlisted && 'fill-[#8B5CF6]')} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!inStock || isCartPending}
          onClick={() => handleAddToCart(true)}
          className="rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] px-4 py-3 text-sm font-semibold text-white"
        >
          Buy Now
        </button>
        <button
          type="button"
          disabled={!inStock || isCartPending}
          onClick={() => handleAddToCart(false)}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] px-4 py-3 text-sm font-semibold text-white',
            cartAdded && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
          )}
        >
          {isCartPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : cartAdded ? (
            <Check className="size-4" />
          ) : (
            <ShoppingCart className="size-4" />
          )}
          Cart
        </button>
      </div>
    </div>
  );
}
