'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCatalogCard } from '@/features/products/components/product-catalog-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import {
  filterRecommendationsByCategory,
  resolveRecommendationReason,
  sortRecommendationItems,
} from '@/features/ai/utils/recommendations.util';

function CarouselSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-[420px] min-w-[280px] shrink-0 rounded-2xl bg-dashboard-surface"
        />
      ))}
    </div>
  );
}

export function RecommendationCarouselSection({
  title,
  subtitle,
  featureBadge,
  items = [],
  mode = 'daily',
  factors = null,
  fashionDna = null,
  categoryFilter = 'all',
  sortId = 'match',
  isLoading = false,
  showQuickView = false,
  className,
}) {
  const scrollRef = useRef(null);

  const visibleItems = sortRecommendationItems(
    filterRecommendationsByCategory(
      items.filter((item) => item?.product?.id),
      categoryFilter,
    ),
    sortId,
  );

  function scrollByOffset(offset) {
    scrollRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  }

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-dashboard-foreground sm:text-2xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="max-w-2xl text-sm text-dashboard-muted">{subtitle}</p>
          ) : null}
        </div>

        <div className="hidden shrink-0 gap-2 sm:flex">
          <button
            type="button"
            aria-label={`Scroll ${title} left`}
            onClick={() => scrollByOffset(-320)}
            className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-[#121820] text-dashboard-muted transition-colors hover:border-[#8B5CF6]/40 hover:text-[#C4B5FD]"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Scroll ${title} right`}
            onClick={() => scrollByOffset(320)}
            className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-[#121820] text-dashboard-muted transition-colors hover:border-[#8B5CF6]/40 hover:text-[#C4B5FD]"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <CarouselSkeleton />
      ) : visibleItems.length ? (
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visibleItems.map((item, index) => (
            <div
              key={item.product.id}
              className="w-[280px] shrink-0 snap-start"
            >
              <ProductCatalogCard
                product={item.product}
                matchScore={item.score}
                isBestMatch={index === 0}
                featureBadge={featureBadge}
                showQuickView={showQuickView}
                recommendationReason={resolveRecommendationReason(item, {
                  factors,
                  fashionDna,
                  mode,
                })}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#121820]/60 px-6 py-10 text-center">
          <p className="text-sm text-dashboard-muted">
            No items in this section for the selected category.
          </p>
        </div>
      )}
    </section>
  );
}
