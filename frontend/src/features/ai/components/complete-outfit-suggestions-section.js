'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Layers, Shirt, Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ProductCardImage } from '@/features/products/components/product-card-image';
import { getProductImageUrl } from '@/features/products/utils/product-catalog.utils';
import { formatCurrency } from '@/utils/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

const SLOT_LABELS = {
  tshirt: 'Top',
  shirt: 'Shirt',
  jacket: 'Outerwear',
  pants: 'Bottom',
  shoes: 'Footwear',
};

function OutfitSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-[360px] min-w-[320px] shrink-0 rounded-2xl bg-dashboard-surface"
        />
      ))}
    </div>
  );
}

export function CompleteOutfitSuggestionsSection({
  outfits = [],
  isLoading = false,
  className,
}) {
  const scrollRef = useRef(null);

  function scrollByOffset(offset) {
    scrollRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  }

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-[#A78BFA]" aria-hidden="true" />
            <h2 className="text-xl font-bold tracking-tight text-dashboard-foreground sm:text-2xl">
              Complete Outfit Suggestions
            </h2>
          </div>
          <p className="max-w-2xl text-sm text-dashboard-muted">
            Coordinated looks built from your top matches — top, bottom, footwear, and more
          </p>
        </div>

        <div className="hidden shrink-0 gap-2 sm:flex">
          <button
            type="button"
            aria-label="Scroll outfits left"
            onClick={() => scrollByOffset(-360)}
            className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-[#121820] text-dashboard-muted transition-colors hover:border-[#8B5CF6]/40 hover:text-[#C4B5FD]"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Scroll outfits right"
            onClick={() => scrollByOffset(360)}
            className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-[#121820] text-dashboard-muted transition-colors hover:border-[#8B5CF6]/40 hover:text-[#C4B5FD]"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <OutfitSkeleton />
      ) : outfits.length ? (
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {outfits.map((outfit) => (
            <article
              key={outfit.id}
              className="interactive-card w-[320px] shrink-0 snap-start overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="border-b border-white/8 bg-gradient-to-br from-[#1a1228] via-[#121820] to-[#0d1117] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8B5CF6]/20 px-2.5 py-1 text-[11px] font-semibold text-[#DDD6FE]">
                    <Sparkles className="size-3" aria-hidden="true" />
                    Complete Look
                  </span>
                  {outfit.matchPercent != null ? (
                    <span className="rounded-full bg-dashboard-success/90 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                      {outfit.matchPercent}% match
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(outfit.outfit || {})
                    .filter(([, value]) => value?.id)
                    .slice(0, 4)
                    .map(([slot, product]) => (
                      <div
                        key={`${outfit.id}-${slot}`}
                        className="overflow-hidden rounded-xl border border-white/10 bg-[#1A2235]"
                      >
                        <div className="relative aspect-square">
                          <ProductCardImage
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            sizes="80px"
                          />
                        </div>
                        <p className="truncate px-1.5 py-1 text-[10px] text-dashboard-muted">
                          {SLOT_LABELS[slot] || slot}
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-3 p-4">
                <p className="line-clamp-2 text-xs text-violet-300/90">{outfit.reason}</p>

                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-dashboard-muted">Estimated value</span>
                  <span className="font-bold text-dashboard-foreground">
                    {formatCurrency(outfit.totalPrice, outfit.currency, { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl border-white/10 text-xs"
                    asChild
                  >
                    <Link href={ROUTES.AI.VIRTUAL_TRY_ON}>View</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl border-white/10 text-xs"
                    asChild
                  >
                    <Link href={ROUTES.AI.VIRTUAL_TRY_ON}>Save</Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 rounded-xl bg-[#8B5CF6] text-xs text-white hover:bg-[#7C3AED]"
                    asChild
                  >
                    <Link href={ROUTES.AI.VIRTUAL_TRY_ON}>
                      <Shirt className="mr-1 size-3.5" aria-hidden="true" />
                      Try-On
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#121820]/60 px-6 py-10 text-center">
          <p className="text-sm text-dashboard-muted">
            Not enough matched items yet to build complete outfits. Browse products or update your profile.
          </p>
        </div>
      )}
    </section>
  );
}
