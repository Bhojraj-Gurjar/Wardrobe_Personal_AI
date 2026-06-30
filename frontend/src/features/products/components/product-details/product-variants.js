'use client';

import { cn } from '@/utils/cn';
import { resolveProductImageUrl } from '@/utils/product-image';

export function ColorSelector({ colors, selectedColor, onSelect }) {
  if (!colors.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Color</h3>
        {selectedColor ? (
          <span className="text-xs text-white/45">{selectedColor}</span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const isSelected = selectedColor === color.id;
          const swatchUrl = resolveProductImageUrl(color.imageUrl);

          return (
            <button
              key={color.id}
              type="button"
              onClick={() => onSelect(color.id)}
              aria-pressed={isSelected}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                isSelected
                  ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-white shadow-[0_0_24px_rgba(139,92,246,0.25)]'
                  : 'border-white/[0.08] bg-white/[0.03] text-white/65 hover:border-[#8B5CF6]/35 hover:text-white',
              )}
            >
              <span className="inline-flex items-center gap-2">
                {swatchUrl ? (
                  <span className="size-4 overflow-hidden rounded-full ring-1 ring-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={swatchUrl} alt="" className="size-full object-cover" />
                  </span>
                ) : null}
                {color.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SizeSelector({ sizes, selectedSize, onSelect }) {
  if (!sizes.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Size</h3>
        <button type="button" className="text-xs font-medium text-[#C4B5FD] hover:text-white">
          Size guide
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {sizes.map((size) => {
          const isSelected = selectedSize === size.id;
          const isDisabled = !size.inStock;

          return (
            <button
              key={size.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(size.id)}
              aria-pressed={isSelected}
              className={cn(
                'rounded-2xl border px-3 py-3 text-sm font-semibold transition-all duration-200',
                isSelected
                  ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-white'
                  : 'border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-[#8B5CF6]/35',
                isDisabled && 'cursor-not-allowed opacity-35 line-through',
              )}
            >
              {size.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProductVariants({
  colors,
  sizes,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
}) {
  return (
    <div className="space-y-5">
      <ColorSelector
        colors={colors}
        selectedColor={selectedColor}
        onSelect={onColorChange}
      />
      <SizeSelector
        sizes={sizes}
        selectedSize={selectedSize}
        onSelect={onSizeChange}
      />
    </div>
  );
}
