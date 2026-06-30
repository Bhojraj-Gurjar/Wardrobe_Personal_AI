'use client';

import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { ProductCardImage } from '@/features/products/components/product-card-image';
import { formatProductPrice, getProductImageUrl } from '@/features/products/utils/product-catalog.utils';
import { cn } from '@/utils/cn';

export function StylistProductCard({ product, className }) {
  const imageUrl = getProductImageUrl(product);
  const price = formatProductPrice(product?.price, product?.currency);

  return (
    <Link
      href={product?.id ? ROUTES.PRODUCTS.DETAIL(product.id) : ROUTES.PRODUCTS.LIST}
      className={cn(
        'interactive-card flex gap-3 rounded-xl border border-dashboard-border bg-dashboard-surface p-3',
        'transition-all duration-200 hover:border-primary/30',
        className,
      )}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-dashboard-surface-elevated">
        <ProductCardImage
          src={imageUrl}
          alt={product?.name || 'Product'}
          sizes="64px"
          imageClassName="object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-primary/90">
          {product?.brand}
        </p>
        <p className="line-clamp-2 text-sm font-semibold text-dashboard-foreground">
          {product?.name}
        </p>
        {price ? (
          <p className="mt-1 text-sm font-bold text-dashboard-foreground">{price}</p>
        ) : null}
      </div>
    </Link>
  );
}
