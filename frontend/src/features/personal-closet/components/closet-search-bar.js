'use client';

import { memo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import {
  CLOSET_GLASS_CARD,
  CLOSET_TRANSITION,
} from '@/features/personal-closet/styles/closet-design-tokens';

const CATEGORY_OPTIONS = [
  'All',
  'Tops',
  'Shirts',
  'Pants',
  'Jackets',
  'Shoes',
  'Accessories',
];

const OCCASION_OPTIONS = ['All', 'Everyday', 'Formal', 'Evening', 'Active'];
const SEASON_OPTIONS = ['All', 'Spring', 'Summer', 'Fall', 'Winter'];
const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'name', label: 'Name' },
  { value: 'value', label: 'Value' },
];

const selectClassName = cn(
  'h-10 rounded-xl border border-white/[0.08] bg-black/25 px-3 text-sm text-white',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40',
);

export const ClosetSearchBar = memo(function ClosetSearchBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  brand,
  onBrandChange,
  color,
  onColorChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  recentlyAdded,
  onRecentlyAddedChange,
  occasion = '',
  onOccasionChange,
  season = '',
  onSeasonChange,
  sortBy = 'latest',
  onSortByChange,
  onClear,
  className,
}) {
  const activeChips = [
    search ? { key: 'search', label: `Search: ${search}` } : null,
    category ? { key: 'category', label: category } : null,
    brand ? { key: 'brand', label: brand } : null,
    color ? { key: 'color', label: color } : null,
    minPrice ? { key: 'min', label: `Min ${minPrice}` } : null,
    maxPrice ? { key: 'max', label: `Max ${maxPrice}` } : null,
    recentlyAdded ? { key: 'recent', label: 'Recently added' } : null,
    occasion ? { key: 'occasion', label: occasion } : null,
    season ? { key: 'season', label: season } : null,
    sortBy && sortBy !== 'latest' ? { key: 'sort', label: `Sort: ${sortBy}` } : null,
  ].filter(Boolean);

  const hasFilters = activeChips.length > 0;

  return (
    <div
      className={cn(
        CLOSET_GLASS_CARD,
        'sticky top-20 z-20 space-y-4 p-4 backdrop-blur-2xl md:p-5',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-[#A855F7]" aria-hidden="true" />
        <p className="text-sm font-semibold text-white">Search & Filter</p>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search products, outfits, brands..."
          aria-label="Search closet"
          className="h-11 rounded-xl border-white/[0.08] bg-black/25 pl-10 text-white placeholder:text-white/35"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          aria-label="Filter by category"
          className={selectClassName}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option === 'All' ? '' : option}>
              {option}
            </option>
          ))}
        </select>

        <Input
          value={brand}
          onChange={(event) => onBrandChange(event.target.value)}
          placeholder="Brand"
          aria-label="Filter by brand"
          className="h-10 rounded-xl border-white/[0.08] bg-black/25 text-white placeholder:text-white/35"
        />

        <Input
          value={color}
          onChange={(event) => onColorChange(event.target.value)}
          placeholder="Color"
          aria-label="Filter by color"
          className="h-10 rounded-xl border-white/[0.08] bg-black/25 text-white placeholder:text-white/35"
        />

        <select
          value={occasion}
          onChange={(event) => onOccasionChange?.(event.target.value === 'All' ? '' : event.target.value)}
          aria-label="Filter by occasion"
          className={selectClassName}
        >
          {OCCASION_OPTIONS.map((option) => (
            <option key={option} value={option === 'All' ? '' : option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={season}
          onChange={(event) => onSeasonChange?.(event.target.value === 'All' ? '' : event.target.value)}
          aria-label="Filter by season"
          className={selectClassName}
        >
          {SEASON_OPTIONS.map((option) => (
            <option key={option} value={option === 'All' ? '' : option}>
              {option}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <Input
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) => onMinPriceChange(event.target.value)}
            placeholder="Min"
            aria-label="Minimum price"
            className="h-10 rounded-xl border-white/[0.08] bg-black/25 text-white placeholder:text-white/35"
          />
          <Input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
            placeholder="Max"
            aria-label="Maximum price"
            className="h-10 rounded-xl border-white/[0.08] bg-black/25 text-white placeholder:text-white/35"
          />
        </div>

        <select
          value={sortBy}
          onChange={(event) => onSortByChange?.(event.target.value)}
          aria-label="Sort closet"
          className={selectClassName}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className={cn(
          'flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/25 px-3 text-sm text-white/55',
          CLOSET_TRANSITION,
          'hover:border-[#7C3AED]/30',
        )}
        >
          <input
            type="checkbox"
            checked={recentlyAdded}
            onChange={(event) => onRecentlyAddedChange(event.target.checked)}
            className="accent-[#7C3AED]"
          />
          Recently added
        </label>
      </div>

      {hasFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center rounded-full border border-[#7C3AED]/25 bg-[#7C3AED]/10 px-3 py-1 text-xs font-medium text-[#E9D5FF] animate-in fade-in zoom-in-95 duration-200"
            >
              {chip.label}
            </span>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-xl text-white/50 hover:bg-white/[0.04] hover:text-white"
            onClick={onClear}
          >
            <X className="mr-1.5 size-3.5" />
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
});

ClosetSearchBar.displayName = 'ClosetSearchBar';
