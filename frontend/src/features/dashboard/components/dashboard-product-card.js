'use client';

import { memo } from 'react';
import Link from 'next/link';
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
        'group relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl',
        'interactive-card cursor-pointer border border-dashboard-border bg-dashboard-surface',
        'transition-[border-color,box-shadow] duration-200',
        'hover:border-primary/30 hover:shadow-[0_12px_32px_rgba(139,92,246,0.12)]',
        'md:rounded-2xl',
        className,
      )}
      {...(isMock ? { 'data-mock': 'true' } : {})}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-dashboard-surface-elevated">
        <ProductCardImage
          src={image}
          alt={name}
          sizes="(max-width: 640px) 42vw, (max-width: 1024px) 20vw, 16vw"
          imageClassName="size-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
        />
        <span
          className={cn(
            'absolute left-2 top-2 z-10 rounded-full px-1.5 py-0.5 text-[9px] font-semibold md:left-3 md:top-3 md:px-2.5 md:py-1 md:text-xs',
            'bg-dashboard-success/90 text-primary-foreground shadow-sm',
          )}
        >
          {matchPercent}% Match
        </span>
      </div>
      {name ? (
        <p className="line-clamp-2 min-h-[2.5rem] flex-1 px-2 py-2 text-[11px] font-medium leading-snug text-dashboard-foreground md:min-h-[2.75rem] md:px-3 md:py-2.5 md:text-xs">
          {name}
        </p>
      ) : null}
    </Link>
  );
});
