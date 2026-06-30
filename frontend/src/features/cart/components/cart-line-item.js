'use client';

import Link from 'next/link';
import { Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ProductCardImage } from '@/features/products/components/product-card-image';
import {
  formatProductPrice,
  getProductImageUrl,
} from '@/features/products/utils/product-catalog.utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

function resolveDisplaySize(product) {
  const options = product?.sizeOptions ?? product?.size_options ?? [];
  return options[0] || 'M';
}

function resolveDisplayColor(product) {
  return product?.color || 'Default';
}

export function CartLineItem({
  item,
  onUpdate,
  onRemove,
  isUpdating = false,
  removing = false,
  className,
}) {
  const product = item.product;
  const imageUrl = getProductImageUrl(product);
  const unitPrice = formatProductPrice(item.price ?? product?.price, product?.currency);
  const lineTotal = formatProductPrice(
    (item.price ?? product?.price ?? 0) * item.quantity,
    product?.currency,
  );
  const displaySize = resolveDisplaySize(product);
  const displayColor = resolveDisplayColor(product);
  const maxQuantity = Math.max(
    1,
    Number(
      item.availableStock
      ?? product?.stockQuantity
      ?? product?.stock_quantity
      ?? 1,
    ),
  );
  const atMaxQuantity = item.quantity >= maxQuantity;

  return (
    <article
      className={cn(
        'relative flex gap-5 rounded-2xl border border-dashboard-border bg-dashboard-surface p-4 sm:p-5 interactive-card',
        className,
      )}
    >
      <Link
        href={ROUTES.PRODUCTS.DETAIL(product?.id)}
        className="relative size-28 shrink-0 overflow-hidden rounded-xl bg-dashboard-surface-elevated sm:size-32"
      >
        <ProductCardImage
          src={imageUrl}
          alt={product?.name || 'Product'}
          sizes="128px"
          imageClassName="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 pr-8 sm:pr-0">
        <div className="min-w-0 space-y-1">
          {product?.brand ? (
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/90">
              {product.brand}
            </p>
          ) : null}

          <Link href={ROUTES.PRODUCTS.DETAIL(product?.id)}>
            <h3 className="line-clamp-2 text-base font-semibold text-dashboard-foreground transition-colors hover:text-primary">
              {product?.name}
            </h3>
          </Link>

          <p className="text-xs text-dashboard-muted">
            Size: {displaySize}
            {' · '}
            Color: {displayColor}
            {maxQuantity <= 10 ? (
              <>
                {' · '}
                {maxQuantity} in stock
              </>
            ) : null}
          </p>
        </div>

        <p className="text-xl font-bold text-dashboard-foreground">
          {lineTotal || unitPrice}
        </p>
      </div>

      <div className="absolute right-4 top-4 flex flex-col items-end justify-between gap-4 sm:relative sm:right-auto sm:top-auto sm:shrink-0 sm:self-stretch sm:py-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-dashboard-muted hover:text-destructive"
          aria-label={`Remove ${product?.name} from cart`}
          disabled={isUpdating || removing}
          onClick={() => onRemove(item.id)}
        >
          {removing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </Button>

        <div
          className={cn(
            'inline-flex items-center rounded-full border border-dashboard-border',
            'bg-dashboard-bg/80 p-0.5',
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-dashboard-muted hover:text-dashboard-foreground"
            aria-label="Decrease quantity"
            disabled={isUpdating || item.quantity <= 1}
            onClick={() => onUpdate(item.id, item.quantity - 1)}
          >
            <Minus className="size-3.5" />
          </Button>
          <span className="min-w-7 text-center text-sm font-semibold text-dashboard-foreground">
            {isUpdating ? '…' : item.quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-dashboard-muted hover:text-dashboard-foreground"
            aria-label="Increase quantity"
            disabled={isUpdating || atMaxQuantity}
            onClick={() => onUpdate(item.id, Math.min(maxQuantity, item.quantity + 1))}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>

        {atMaxQuantity ? (
          <p className="text-[11px] font-medium text-amber-300/90">
            Max available: {maxQuantity}
          </p>
        ) : null}
      </div>
    </article>
  );
}
