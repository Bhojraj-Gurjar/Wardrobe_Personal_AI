'use client';

import { ProductCatalogCard } from '@/features/products/components/product-catalog-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Shirt } from 'lucide-react';
import { cn } from '@/utils/cn';

function ProductGridSkeleton({ compact }) {
  return (
    <div
      className={cn(
        compact
          ? 'space-y-3'
          : 'grid gap-5 md:grid-cols-2 xl:grid-cols-4',
      )}
    >
      {Array.from({ length: compact ? 6 : 8 }).map((_, index) => (
        <div key={index} className={compact ? 'flex gap-3' : 'space-y-3'}>
          <Skeleton
            className={cn(
              'rounded-xl',
              compact ? 'h-28 w-24 shrink-0' : 'aspect-[3/4] w-full',
            )}
          />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductGrid({
  items,
  total,
  page,
  limit,
  viewMode = 'grid',
  scoreByProductId = {},
  bestMatchProductId,
  isLoading,
  isError,
  error,
  onRetry,
  onPageChange,
}) {
  const compact = viewMode === 'compact';

  if (isLoading) {
    return <ProductGridSkeleton compact={compact} />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load products"
        description={error?.message || 'Something went wrong.'}
        onRetry={onRetry}
      />
    );
  }

  if (!items?.length) {
    return (
      <EmptyState
        icon={Shirt}
        title="No products found."
        description="Try adjusting your search or filters."
      />
    );
  }

  const currentPage = page ?? 1;
  const pageSize = limit ?? 12;
  const totalItems = total ?? items.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return (
    <div className="space-y-8">
      <div
        className={cn(
          compact
            ? 'space-y-3'
            : 'grid gap-5 md:grid-cols-2 xl:grid-cols-4',
        )}
      >
        {items.map((product) => (
          <ProductCatalogCard
            key={product.id}
            product={product}
            compact={compact}
            matchScore={scoreByProductId[product.id]}
            isBestMatch={product.id === bestMatchProductId}
          />
        ))}
      </div>

      {totalPages > 1 ? (
        <nav
          className="flex items-center justify-center gap-3"
          aria-label="Product pagination"
        >
          <Button
            variant="glass"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Previous
          </Button>
          <span className="text-sm text-dashboard-muted">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="glass"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
