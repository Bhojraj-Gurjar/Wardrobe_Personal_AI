'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import {
  PRICE_RANGE,
  SIDEBAR_CATEGORIES,
} from '@/features/products/constants/catalog-categories';
import { PRODUCT_TYPES } from '@/constants/product-types';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/currency';

export function ProductSidebarFilters({
  id,
  uiCategory,
  productType,
  priceRange,
  onCategoryChange,
  onProductTypeChange,
  onPriceRangeChange,
  onClose,
  className,
}) {
  const [minPrice, maxPrice] = priceRange;

  return (
    <aside
      id={id}
      className={cn(
        'sticky top-24 h-fit rounded-xl border border-dashboard-border bg-dashboard-surface p-5',
        className,
      )}
    >
      <div className="mb-6 flex items-center justify-between gap-2 text-dashboard-foreground">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Filters</h2>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-dashboard-muted transition-colors hover:bg-white/10 hover:text-dashboard-foreground"
            aria-label="Close filters"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-dashboard-muted">
            Category
          </h3>
          <ul className="space-y-1">
            {SIDEBAR_CATEGORIES.map((category) => {
              const active = uiCategory === category.id;

              return (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => onCategoryChange(category.id)}
                    className={cn(
                      'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-all duration-200',
                      active
                        ? 'bg-primary font-medium text-primary-foreground shadow-sm'
                        : 'text-dashboard-muted hover:bg-dashboard-surface-elevated hover:text-dashboard-foreground hover:shadow-sm',
                    )}
                  >
                    {category.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-dashboard-muted">
            Product Type
          </h3>
          <select
            value={productType || ''}
            onChange={(event) => onProductTypeChange(event.target.value || null)}
            className="h-10 w-full rounded-lg border border-dashboard-border bg-dashboard-bg px-3 text-sm text-dashboard-foreground"
          >
            <option value="">All types</option>
            {PRODUCT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-dashboard-muted">
              Price Range
            </h3>
            <span className="text-xs text-dashboard-muted">
              {formatCurrency(minPrice)} – {formatCurrency(maxPrice)}
            </span>
          </div>
          <input
            type="range"
            min={PRICE_RANGE.min}
            max={PRICE_RANGE.max}
            step={5}
            value={maxPrice}
            onChange={(event) =>
              onPriceRangeChange([minPrice, Number(event.target.value)])
            }
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-dashboard-surface-elevated accent-primary"
            aria-label="Maximum price"
          />
          <div className="mt-2 flex justify-between text-xs text-dashboard-muted">
            <span>{formatCurrency(PRICE_RANGE.min)}</span>
            <span>{formatCurrency(PRICE_RANGE.max)}</span>
          </div>
        </section>

        <section className="rounded-lg border border-dashed border-dashboard-border p-3">
          <p className="text-xs font-medium text-dashboard-foreground">Coming soon</p>
          <p className="mt-1 text-xs text-dashboard-muted">
            Brand, color, and occasion filters
          </p>
        </section>
      </div>
    </aside>
  );
}
