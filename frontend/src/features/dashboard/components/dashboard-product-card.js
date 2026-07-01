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
        'group relative flex w-[140px] shrink-0 snap-start flex-col overflow-hidden rounded-xl',
        'interactive-card cursor-pointer border border-dashboard-border bg-dashboard-surface',
        'md:w-[160px] md:rounded-2xl',
        className,
      )}
      {...(isMock ? { 'data-mock': 'true' } : {})}
    >
      <div className="relative h-[148px] overflow-hidden bg-dashboard-surface-elevated md:h-[180px]">
        <ProductCardImage
          src={image}
          alt={name}
          sizes="(max-width: 1024px) 140px, 160px"
          imageClassName="size-full object-cover transition-transform duration-300 md:group-hover:scale-105"
        />
        <span
          className={cn(
            'absolute left-2 top-2 z-10 rounded-full px-1.5 py-0.5 text-[9px] font-semibold md:left-3 md:top-3 md:px-2.5 md:py-1 md:text-xs',
            'bg-dashboard-success/90 text-primary-foreground',
          )}
        >
          {matchPercent}% Match
        </span>
        <button
          type="button"
          className={cn(
            'absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full',
            'bg-dashboard-bg/70 text-dashboard-foreground backdrop-blur',
            'md:right-3 md:top-3 md:opacity-0 md:transition-opacity md:group-hover:opacity-100',
          )}
          aria-label={`Save ${name} to wishlist`}
          onClick={(event) => event.preventDefault()}
        >
          <Heart className="size-3.5 md:size-4" />
        </button>
      </div>
      {name ? (
        <p className="line-clamp-2 min-h-[2.25rem] px-2 py-1.5 text-[11px] font-medium leading-tight text-dashboard-foreground md:min-h-0 md:px-3 md:py-2 md:text-xs">
          {name}
        </p>
      ) : null}
    </Link>
  );
});
