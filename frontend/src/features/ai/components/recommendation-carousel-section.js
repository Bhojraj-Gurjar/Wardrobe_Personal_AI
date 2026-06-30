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
    <div className="flex gap-2.5 overflow-hidden md:gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-[220px] min-w-[148px] shrink-0 rounded-xl bg-dashboard-surface md:h-[420px] md:min-w-[280px] md:rounded-2xl"
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
    <section className={cn('space-y-3 md:space-y-4', className)}>
      <div className="flex items-end justify-between gap-3 md:gap-4">
        <div className="min-w-0 space-y-0.5 md:space-y-1">
          <h2 className="truncate text-base font-bold tracking-tight text-dashboard-foreground md:text-xl lg:text-2xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="line-clamp-2 max-w-2xl text-[11px] leading-snug text-dashboard-muted md:text-sm">{subtitle}</p>
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
          className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-4 md:pb-2 [&::-webkit-scrollbar]:hidden"
        >
          {visibleItems.map((item, index) => (
            <div
              key={item.product.id}
              className="w-[148px] shrink-0 snap-start sm:w-[180px] md:w-[240px] lg:w-[280px]"
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
