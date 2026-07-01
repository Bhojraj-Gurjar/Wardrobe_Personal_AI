'use client';

import { LayoutGrid, List, Search, SlidersHorizontal } from 'lucide-react';
import { TOPBAR_CATEGORIES } from '@/features/products/constants/catalog-categories';
import { ProductSortDropdown } from '@/features/products/components/product-sort-dropdown';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

export function ProductCatalogToolbar({
  search,
  uiCategory,
  sortId,
  viewMode,
  resultCount,
  isFilterOpen = false,
  showSearch = true,
  showCategoryChips = true,
  onSearchChange,
  searchReadOnly = false,
  onCategoryChange,
  onSortChange,
  onViewModeChange,
  onFilterToggle,
}) {
  const hasTopSection = showSearch || showCategoryChips;

  return (
    <div className={cn(hasTopSection && 'space-y-4')}>
      {showSearch ? (
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dashboard-muted"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            readOnly={searchReadOnly}
            placeholder="Search products..."
            className="h-11 border-dashboard-border bg-dashboard-surface pl-9 text-dashboard-foreground placeholder:text-dashboard-muted"
          />
        </div>
      ) : null}

      {showCategoryChips ? (
        <div className="flex flex-wrap gap-2">
          {TOPBAR_CATEGORIES.map((category) => {
            const active = uiCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-primary font-medium text-primary-foreground'
                    : 'border border-dashboard-border bg-dashboard-surface text-dashboard-muted hover:text-dashboard-foreground',
                )}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
          hasTopSection
            ? 'border-y border-dashboard-border/60 py-4'
            : 'border-b border-dashboard-border/60 pb-4',
        )}
      >
        <p className="text-sm font-medium text-dashboard-foreground">
          Showing{' '}
          <span className="text-dashboard-muted">{resultCount}</span>
          {' '}
          {resultCount === 1 ? 'Product' : 'Products'}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          {onFilterToggle ? (
            <button
              type="button"
              onClick={onFilterToggle}
              className={cn(
                'inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-all duration-200',
                isFilterOpen
                  ? 'border-primary/50 bg-primary/15 text-primary shadow-[0_0_20px_rgba(124,58,237,0.15)]'
                  : 'border-white/10 bg-dashboard-surface text-dashboard-foreground hover:border-primary/30 hover:bg-primary/10',
              )}
              aria-expanded={isFilterOpen}
              aria-controls="product-filters-panel"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Filters
            </button>
          ) : null}

          <ProductSortDropdown
            value={sortId}
            onChange={onSortChange}
            className="sm:w-[200px] lg:w-[240px]"
          />

          <div
            className="flex self-end rounded-xl border border-white/[0.08] bg-dashboard-surface/80 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md sm:self-auto"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'flex h-10 w-12 items-center justify-center rounded-lg transition-all duration-200',
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-dashboard-muted hover:bg-white/[0.06] hover:text-dashboard-foreground',
              )}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('compact')}
              className={cn(
                'flex h-10 w-12 items-center justify-center rounded-lg transition-all duration-200',
                viewMode === 'compact'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-dashboard-muted hover:bg-white/[0.06] hover:text-dashboard-foreground',
              )}
              aria-label="List view"
              aria-pressed={viewMode === 'compact'}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
