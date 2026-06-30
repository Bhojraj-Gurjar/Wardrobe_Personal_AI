'use client';

import Link from 'next/link';
import { Sparkles, Star } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';
import { isProductInStock, isTryOnCompatible } from '../../utils/product-details.utils';

function BadgePill({ children, tone = 'default' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide',
        tone === 'purple' && 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white',
        tone === 'success' && 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20',
        tone === 'warning' && 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/20',
        tone === 'default' && 'bg-white/[0.06] text-white/70 ring-1 ring-white/[0.08]',
      )}
    >
      {children}
    </span>
  );
}

export function ProductInfo({ product }) {
  const rating = product?.rating ?? product?.average_rating ?? null;
  const reviewCount = product?.reviewCount ?? product?.review_count ?? null;
  const inStock = isProductInStock(product);
  const tryOn = isTryOnCompatible(product);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {product?.brand ? (
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C4B5FD]">
            {product.brand}
          </p>
        ) : null}

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-tight">
          {product.name}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-sm text-white/55">
          {product.category ? <span>{product.category}</span> : null}
          {product.productType || product.product_type ? (
            <span className="text-white/35">·</span>
          ) : null}
          {product.productType || product.product_type ? (
            <span>{product.productType || product.product_type}</span>
          ) : null}
        </div>
      </div>

      {rating != null ? (
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1 rounded-full bg-white/[0.05] px-3 py-1.5">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-white">{rating}</span>
          </div>
          {reviewCount != null ? (
            <span className="text-white/50">{reviewCount} reviews</span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {inStock ? (
          <BadgePill tone="success">In Stock</BadgePill>
        ) : (
          <BadgePill tone="warning">Out of Stock</BadgePill>
        )}
        {product?.isNewArrival || product?.is_new_arrival ? (
          <BadgePill tone="purple">New</BadgePill>
        ) : null}
        {product?.isBestSeller || product?.is_best_seller ? (
          <BadgePill tone="purple">Best Seller</BadgePill>
        ) : null}
        {tryOn ? (
          <Link href={ROUTES.AI.VIRTUAL_TRY_ON}>
            <BadgePill tone="purple">
              <Sparkles className="mr-1 inline size-3" />
              Try-On Ready
            </BadgePill>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
