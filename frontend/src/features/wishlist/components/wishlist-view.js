'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, Loader2, ShoppingBag } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useRecommendationsQuery } from '@/features/ai/hooks';
import { buildRecommendationScoreMap, resolveRecommendationItems } from '@/features/products/utils/product-catalog.utils';
import { addCartItem } from '@/features/cart/services';
import { WishlistProductCard } from '@/features/wishlist/components/wishlist-product-card';
import {
  useRemoveFromWishlistMutation,
  useWishlistQuery,
} from '@/features/wishlist/hooks';
import { removeFromWishlist } from '@/features/wishlist/services';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/utils/cn';
function WishlistSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-2xl border border-dashboard-border p-0">
            <Skeleton className="aspect-[3/4] w-full rounded-t-2xl" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WishlistView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);
  const [movingAll, setMovingAll] = useState(false);
  const [moveAllError, setMoveAllError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const { data, isLoading, isError, error, refetch } = useWishlistQuery();
  const removeMutation = useRemoveFromWishlistMutation();
  const { data: recommendations } = useRecommendationsQuery({ limit: 50 });

  const items = data?.items ?? [];

  const movableItems = useMemo(
    () => items.filter((item) => {
      const productId = item.product?.id || item.product_id;
      return Boolean(productId) && item.product?.isActive !== false;
    }),
    [items],
  );

  const scoreByProductId = useMemo(
    () => buildRecommendationScoreMap(resolveRecommendationItems(recommendations)),
    [recommendations],
  );

  const handleMoveAllToCart = useCallback(async () => {
    if (movingAll || !movableItems.length || !token) {
      return;
    }

    setMovingAll(true);
    setMoveAllError('');

    try {
      for (const item of movableItems) {
        const productId = item.product?.id || item.product_id;
        await addCartItem(productId, token);
        await removeFromWishlist(item.id, token);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cart'] }),
        queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
      ]);
    } catch (moveError) {
      setMoveAllError(moveError?.message || 'Could not move all items to cart.');
    } finally {
      setMovingAll(false);
    }
  }, [movableItems, movingAll, queryClient, token]);

  function handleRemove(id) {
    setRemovingId(id);
    removeMutation.mutate(id, {
      onSettled: () => setRemovingId(null),
    });
  }

  if (isLoading) {
    return <WishlistSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load wishlist"
        description={error?.message || 'Something went wrong.'}
        onRetry={refetch}
      />
    );
  }

  if (!items.length) {
    return (
      <div className="space-y-8">
        <WishlistPageHeader count={0} />
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save products you love and come back to them anytime."
          actionLabel="Browse products"
          onAction={() => router.push(ROUTES.PRODUCTS.LIST)}
          className="border-dashboard-border bg-dashboard-surface/50"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <WishlistPageHeader
        count={items.length}
        onMoveAll={handleMoveAllToCart}
        moveAllDisabled={movingAll || !movableItems.length}
        moveAllLoading={movingAll}
      />

      {moveAllError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {moveAllError}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {items.map((item) => (
          <WishlistProductCard
            key={item.id}
            item={item}
            matchScore={scoreByProductId[item.product_id]}
            onRemove={handleRemove}
            isRemoving={removingId === item.id && removeMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function WishlistPageHeader({
  count,
  onMoveAll,
  moveAllDisabled = false,
  moveAllLoading = false,
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-dashboard-foreground sm:text-3xl">
          My Wishlist
        </h1>
        <p className="mt-1 text-sm text-dashboard-muted">
          {count} saved {count === 1 ? 'item' : 'items'}
        </p>
      </div>

      {count > 0 && onMoveAll ? (
        <Button
          type="button"
          className={cn(
            'h-11 shrink-0 rounded-xl px-5 shadow-lg shadow-primary/20',
            'bg-primary text-primary-foreground hover:bg-primary/90',
          )}
          disabled={moveAllDisabled}
          onClick={onMoveAll}
        >
          {moveAllLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShoppingBag className="size-4" />
          )}
          Move All to Cart
        </Button>
      ) : null}
    </div>
  );
}
