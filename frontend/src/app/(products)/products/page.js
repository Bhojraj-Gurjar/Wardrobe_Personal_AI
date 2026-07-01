import { Suspense } from 'react';
import { ProductsView } from '@/features/products/components/products-view';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Products',
};

function ProductsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full rounded-xl bg-dashboard-surface" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton
            key={index}
            className="aspect-[3/4] rounded-2xl bg-dashboard-surface"
          />
        ))}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsView />
    </Suspense>
  );
}
