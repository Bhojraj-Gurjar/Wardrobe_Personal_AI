'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { ProductCardImage } from '@/features/products/components/product-card-image';
import { cn } from '@/utils/cn';

export const DashboardProductCard = memo(function DashboardProductCard({
  name,
  image,
  matchPercent,
  href,
  isMock = false,
  className,
}) {
  return (
    <Link
      href={href}
      prefetch
      className={cn(
        'group relative flex min-w-[160px] flex-1 flex-col overflow-hidden rounded-2xl interactive-card cursor-pointer',
        'border border-dashboard-border bg-dashboard-surface',
        className,
      )}
      {...(isMock ? { 'data-mock': 'true' } : {})}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-dashboard-surface-elevated">
        <ProductCardImage
          src={image}
          alt={name}
          sizes="200px"
          imageClassName="transition-transform duration-300 group-hover:scale-105"
        />
        <span
          className={cn(
            'absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-xs font-semibold',
            'bg-dashboard-success/90 text-primary-foreground',
          )}
        >
          {matchPercent}% Match
        </span>
        <button
          type="button"
          className={cn(
            'absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full',
            'bg-dashboard-bg/70 text-dashboard-foreground backdrop-blur',
            'opacity-0 transition-opacity group-hover:opacity-100',
          )}
          aria-label={`Save ${name} to wishlist`}
          onClick={(event) => event.preventDefault()}
        >
          <Heart className="size-4" aria-hidden="true" />
        </button>
      </div>
    </Link>
  );
});
