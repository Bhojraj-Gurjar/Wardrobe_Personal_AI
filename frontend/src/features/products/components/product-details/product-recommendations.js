'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCatalogCard } from '@/features/products/components/product-catalog-card';
import { Skeleton } from '@/components/ui/skeleton';

export function RecommendationCarousel({
  title,
  subtitle,
  products = [],
  isLoading = false,
}) {
  const scrollRef = useRef(null);

  if (!isLoading && !products.length) {
    return null;
  }

  function scrollByOffset(offset) {
    scrollRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-white/50">{subtitle}</p> : null}
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            aria-label={`Scroll ${title} left`}
            onClick={() => scrollByOffset(-320)}
            className="flex size-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#111827] text-white/60 transition hover:border-[#8B5CF6]/40 hover:text-white"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Scroll ${title} right`}
            onClick={() => scrollByOffset(320)}
            className="flex size-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#111827] text-white/60 transition hover:border-[#8B5CF6]/40 hover:text-white"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[420px] min-w-[280px] shrink-0 rounded-3xl bg-white/[0.05]" />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => (
            <div key={product.id} className="min-w-[280px] max-w-[280px] shrink-0">
              <ProductCatalogCard product={product} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function SimilarProducts({ products, isLoading }) {
  return (
    <RecommendationCarousel
      title="Similar Products"
      subtitle="Curated pieces with a similar silhouette, palette, and mood."
      products={products}
      isLoading={isLoading}
    />
  );
}

export function RecentlyViewed({ products, isLoading }) {
  return (
    <RecommendationCarousel
      title="Recently Viewed"
      subtitle="Continue exploring pieces you were interested in."
      products={products}
      isLoading={isLoading}
    />
  );
}

export function ProductRecommendations({
  title = 'Pairs perfectly with',
  subtitle = 'AI-styled companions selected for this product.',
  products,
  isLoading,
}) {
  return (
    <RecommendationCarousel
      title={title}
      subtitle={subtitle}
      products={products}
      isLoading={isLoading}
    />
  );
}
