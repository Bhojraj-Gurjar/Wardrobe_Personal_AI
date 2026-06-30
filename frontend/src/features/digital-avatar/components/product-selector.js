'use client';

import Image from 'next/image';
import { Check, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { formatPrice, isProductSelected } from '../utils/outfit-builder.util';
import { getCategoryDescription } from '../utils/ai-outfit-suggest.util';

function ProductCard({ product, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(product)}
      className={cn(
        'group relative h-full w-[168px] shrink-0 cursor-pointer overflow-hidden rounded-2xl border text-left transition-all duration-200',
        isSelected
          ? 'border-purple-500 shadow-lg shadow-purple-500/20'
          : 'border-white/10 hover:scale-105 hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/20',
      )}
      style={{ backgroundColor: '#0F172A' }}
    >
      {isSelected ? (
        <span className="absolute right-3 top-3 z-10 flex size-7 items-center justify-center rounded-full bg-purple-600 text-white">
          <Check className="size-4" />
        </span>
      ) : null}

      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#141E32]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="180px"
            unoptimized
          />
        ) : (
          <div
            className="flex h-full flex-col items-center justify-end p-4"
            style={{
              background: `linear-gradient(180deg, #1A2235 0%, ${product.color || '#374151'}88 100%)`,
            }}
          >
            <div
              className="mb-3 size-16 rounded-xl border border-white/10"
              style={{ backgroundColor: product.color || '#374151' }}
            />
          </div>
        )}
        <span
          className="absolute bottom-3 left-3 size-4 rounded-full border border-white/20"
          style={{ backgroundColor: product.color || '#8B5CF6' }}
        />
      </div>

      <div className="space-y-1 p-3">
        <p className="text-[10px] font-semibold tracking-wider text-dashboard-muted">
          {product.brand}
        </p>
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-dashboard-foreground">
          {product.title}
        </p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-sm font-semibold text-dashboard-foreground">
            {formatPrice(product.price, product.currency)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-[#F59E0B]">
            <Star className="size-3 fill-[#F59E0B]" />
            {product.rating}
          </span>
        </div>
      </div>
    </button>
  );
}

export function ProductSelector({
  categoryId,
  categoryLabel,
  products = [],
  outfit,
  onSelect,
  onUnselect,
  className,
}) {
  const description = getCategoryDescription(categoryId, outfit);
  const hasSelection = products.some((product) =>
    isProductSelected(outfit, categoryId, product.id),
  );

  return (
    <div
      className={cn(
        'mb-6 space-y-4 rounded-[28px] border border-white/10 bg-[#111827] p-6',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-dashboard-foreground">
            {categoryLabel}
          </h3>
          <p className="text-sm text-dashboard-muted">{description}</p>
        </div>
        {hasSelection ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onUnselect?.(categoryId)}
            className="shrink-0 text-dashboard-muted hover:text-dashboard-foreground"
          >
            <X className="mr-1 size-4" />
            Unselect
          </Button>
        ) : null}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.length ? products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isSelected={isProductSelected(outfit, categoryId, product.id)}
            onSelect={(item) => onSelect?.(categoryId, item)}
          />
        )) : (
          <div className="flex min-h-[220px] w-full items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 text-center text-sm text-dashboard-muted">
            No products in this category yet. Browse the catalog or try another tab.
          </div>
        )}
      </div>
    </div>
  );
}
