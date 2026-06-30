'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import { VIRTUAL_TRY_ON_CATALOG_CATEGORIES } from '../../constants/virtual-try-on.constants';
import { VTO_CARD_CLASS, VTO_TRANSITION } from '../../styles/virtual-try-on-tokens';
import { OutfitCard } from './outfit-card';

export function OutfitCarousel({
  products,
  isLoading,
  selectedProductId,
  selectedOutfitSlots = {},
  selectedOutfitItems = [],
  activeCategory,
  search,
  compatibleOnly,
  tryOnModeLabel,
  onCategoryChange,
  onSearchChange,
  onCompatibleOnlyChange,
  onSelectProduct,
}) {
  return (
    <section className={cn(VTO_CARD_CLASS, 'flex flex-col overflow-hidden')}>
      <div className="border-b border-white/[0.08] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Build Your Outfit</h2>
            <p className="mt-1 text-sm text-white/50">
              Tap tops, bottoms, and jackets. We auto-detect the try-on mode.
            </p>
          </div>
          {tryOnModeLabel ? (
            <span className="shrink-0 rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C4B5FD]">
              {tryOnModeLabel}
            </span>
          ) : null}
        </div>

        {selectedOutfitItems.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedOutfitItems.map(({ slot, product }) => (
              <span
                key={`${slot}-${product.id}`}
                className="inline-flex items-center gap-1 rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-2.5 py-1 text-[10px] font-medium text-[#E9D5FF]"
              >
                <span className="uppercase tracking-wide text-white/45">{slot}</span>
                <span className="text-white/80">{product.name}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-3 border-b border-white/[0.08] px-5 py-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search styles, brands…"
            aria-label="Search outfits"
            className="h-10 border-white/[0.08] bg-black/30 pl-10 text-white placeholder:text-white/35"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => onCategoryChange('')}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium',
              VTO_TRANSITION,
              !activeCategory
                ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#A855F7]'
                : 'border-white/[0.08] text-white/50 hover:text-white',
            )}
          >
            All
          </button>
          {VIRTUAL_TRY_ON_CATALOG_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium',
                VTO_TRANSITION,
                activeCategory === category.id
                  ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#A855F7]'
                  : 'border-white/[0.08] text-white/50 hover:text-white',
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {onCompatibleOnlyChange ? (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-white/50">
            <input
              type="checkbox"
              checked={compatibleOnly}
              onChange={(event) => onCompatibleOnlyChange(event.target.checked)}
              className="size-3.5 rounded border-white/20 bg-black/30 accent-[#7C3AED]"
            />
            Compatible products only
          </label>
        ) : null}
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[220px] w-[140px] shrink-0 animate-pulse rounded-2xl bg-white/5"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/50">
            No products found. Try another search or category.
          </p>
        ) : (
          <div
            className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="listbox"
            aria-label="Outfit selection"
          >
            {products.map((product) => {
              const slot = product.tryOnSlot;
              const isSelected = slot
                ? String(selectedOutfitSlots?.[slot]) === String(product.id)
                : String(selectedProductId) === String(product.id);

              return (
                <OutfitCard
                  key={product.id}
                  product={product}
                  isSelected={isSelected}
                  onSelect={onSelectProduct}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
