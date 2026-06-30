'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { CartLineItem } from '@/features/cart/components/cart-line-item';
import { CartOrderSummary } from '@/features/cart/components/cart-order-summary';
import {
  useCartQuery,
  useCheckoutCartMutation,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from '@/features/cart/hooks';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

function CartSkeleton() {
  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex gap-5 rounded-2xl border border-dashboard-border bg-dashboard-surface p-5"
          >
            <Skeleton className="size-32 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-7 w-20" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-[28rem] rounded-2xl" />
    </div>
  );
}

function CartPageHeader({ itemCount }) {
  return (
    <h1 className="text-2xl font-bold tracking-tight text-dashboard-foreground sm:text-3xl">
      Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
    </h1>
  );
}

export function CartView() {
  return (
    <Suspense fallback={<CartSkeleton />}>
      <CartViewContent />
    </Suspense>
  );
}

function CartViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutRef = useRef(null);
  const fromOutfitCheckout = searchParams.get('checkout') === '1';
  const [showOutfitBanner, setShowOutfitBanner] = useState(fromOutfitCheckout);
  const [promoInput, setPromoInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [promoError, setPromoError] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useCartQuery(appliedCoupon);
  const updateMutation = useUpdateCartItemMutation();
  const removeMutation = useRemoveCartItemMutation();
  const checkoutMutation = useCheckoutCartMutation();

  const items = data?.items ?? [];
  const summary = data?.summary ?? {};

  useEffect(() => {
    if (!appliedCoupon || isFetching || !items.length) {
      return;
    }

    if (!summary.appliedCoupon) {
      setPromoError('Invalid promo code');
    } else {
      setPromoError(null);
    }
  }, [appliedCoupon, isFetching, items.length, summary.appliedCoupon]);

  function handleApplyPromo() {
    const code = promoInput.trim();
    if (!code) {
      setPromoError('Enter a promo code');
      return;
    }

    setPromoError(null);
    setAppliedCoupon(code.toUpperCase());
  }

  function handleUpdateQuantity(id, quantity) {
    setUpdatingId(id);
    updateMutation.mutate(
      { id, quantity },
      { onSettled: () => setUpdatingId(null) },
    );
  }

  function handleRemove(id) {
    setRemovingId(id);
    removeMutation.mutate(id, {
      onSettled: () => setRemovingId(null),
    });
  }

  useEffect(() => {
    if (!fromOutfitCheckout || isLoading || !items.length) {
      return;
    }

    checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [fromOutfitCheckout, isLoading, items.length]);

  function handleCheckout() {
    const query = appliedCoupon ? `?coupon=${encodeURIComponent(appliedCoupon)}` : '';
    router.push(`${ROUTES.CHECKOUT}${query}`);
  }

  if (isLoading) {
    return <CartSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load cart"
        description={error?.message || 'Something went wrong.'}
        onRetry={refetch}
      />
    );
  }

  const itemCount = data?.item_count ?? items.reduce((sum, item) => sum + item.quantity, 0);

  if (!items.length) {
    return (
      <div className="space-y-8">
        <CartPageHeader itemCount={0} />
        {checkoutSuccess ? (
          <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {checkoutSuccess}{' '}
            <Link href={ROUTES.ORDERS} className="font-medium underline underline-offset-2">
              View orders
            </Link>
          </p>
        ) : null}
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Add items from the product catalog to see them here."
          actionLabel="Browse products"
          onAction={() => router.push(ROUTES.PRODUCTS.LIST)}
          className="border-dashboard-border bg-dashboard-surface/50"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <CartPageHeader itemCount={itemCount} />

        {showOutfitBanner ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-dashboard-foreground">
            Your outfit is ready in the cart. Review items below and complete checkout on the
            right.
            <button
              type="button"
              onClick={() => setShowOutfitBanner(false)}
              className="ml-2 text-primary underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className={cn('space-y-4', isFetching && 'opacity-80')}>
          {items.map((item) => (
            <CartLineItem
              key={item.id}
              item={item}
              onUpdate={handleUpdateQuantity}
              onRemove={handleRemove}
              isUpdating={updatingId === item.id && updateMutation.isPending}
              removing={removingId === item.id && removeMutation.isPending}
            />
          ))}
        </div>
      </div>

      <CartOrderSummary
        ref={checkoutRef}
        summary={summary}
        promoInput={promoInput}
        onPromoInputChange={(value) => {
          setPromoInput(value);
          setPromoError(null);
        }}
        onApplyPromo={handleApplyPromo}
        onCheckout={handleCheckout}
        checkoutLoading={false}
        checkoutError={checkoutError}
        promoError={promoError}
        highlightCheckout={fromOutfitCheckout}
      />
    </div>
  );
}
