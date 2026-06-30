'use client';

import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import {
  CMS_FASHION_COLORS,
  getSizesForProductType,
} from '../constants/cms-taxonomy';

export type VariantRow = {
  id: string;
  color: string;
  size: string;
  stock: number;
  sku?: string;
  priceOverride?: number | null;
};

type VariantSelectorProps = {
  productType: string;
  value: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
  baseSku?: string;
};

function createVariantId() {
  return `var-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function VariantSelector({ productType, value, onChange, baseSku }: VariantSelectorProps) {
  const [customColor, setCustomColor] = useState('');
  const [activeColor, setActiveColor] = useState(CMS_FASHION_COLORS[0]);
  const [colors, setColors] = useState<string[]>([...CMS_FASHION_COLORS]);
  const sizes = useMemo(() => getSizesForProductType(productType), [productType]);

  const variantsByColor = useMemo(() => {
    const map = new Map<string, VariantRow[]>();
    for (const variant of value) {
      const list = map.get(variant.color) || [];
      list.push(variant);
      map.set(variant.color, list);
    }
    return map;
  }, [value]);

  const toggleSize = (color: string, size: string) => {
    const existing = value.find((variant) => variant.color === color && variant.size === size);
    if (existing) {
      onChange(value.filter((variant) => variant.id !== existing.id));
      return;
    }

    const slug = `${color}-${size}`.replace(/\s+/g, '').toUpperCase();
    onChange([
      ...value,
      {
        id: createVariantId(),
        color,
        size,
        stock: 0,
        sku: baseSku ? `${baseSku}-${slug}` : undefined,
      },
    ]);
  };

  const updateVariant = (id: string, patch: Partial<VariantRow>) => {
    onChange(value.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)));
  };

  const addCustomColor = () => {
    const trimmed = customColor.trim();
    if (!trimmed || colors.includes(trimmed)) return;
    setColors((prev) => [...prev, trimmed]);
    setActiveColor(trimmed);
    setCustomColor('');
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-medium text-dashboard-muted">Color</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setActiveColor(color)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                activeColor === color
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-dashboard-border text-dashboard-muted hover:border-primary/40',
              )}
            >
              {color}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={customColor}
            onChange={(event) => setCustomColor(event.target.value)}
            placeholder="Add new color"
            className="border-dashboard-border bg-dashboard-bg"
          />
          <Button type="button" variant="outline" size="sm" onClick={addCustomColor} className="shrink-0 gap-1">
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-dashboard-muted">
          Sizes for {activeColor}
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {sizes.map((size) => {
            const selected = value.some(
              (variant) => variant.color === activeColor && variant.size === size,
            );
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(activeColor, size)}
                className={cn(
                  'min-w-10 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-dashboard-border text-dashboard-muted hover:border-primary/40',
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {value.length ? (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-dashboard-muted">
            Variant inventory ({value.length} combinations)
          </p>
          {[...variantsByColor.entries()].map(([color, variants]) => (
            <div key={color} className="rounded-xl border border-dashboard-border bg-dashboard-bg/40 p-4">
              <p className="mb-3 text-sm font-semibold text-dashboard-foreground">{color}</p>
              <div className="space-y-2">
                {variants.map((variant) => (
                  <div key={variant.id} className="grid gap-2 rounded-lg border border-dashboard-border/60 bg-dashboard-surface p-3 sm:grid-cols-5">
                    <div>
                      <p className="text-[10px] uppercase text-dashboard-muted">Size</p>
                      <p className="text-sm font-medium">{variant.size}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-dashboard-muted">Stock</p>
                      <Input
                        type="number"
                        min={0}
                        value={variant.stock}
                        onChange={(event) => updateVariant(variant.id, { stock: Number(event.target.value) })}
                        className="mt-0.5 h-8 border-dashboard-border bg-dashboard-bg text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-dashboard-muted">SKU</p>
                      <Input
                        value={variant.sku || ''}
                        onChange={(event) => updateVariant(variant.id, { sku: event.target.value })}
                        className="mt-0.5 h-8 border-dashboard-border bg-dashboard-bg text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-dashboard-muted">Price override</p>
                      <Input
                        type="number"
                        min={0}
                        value={variant.priceOverride ?? ''}
                        onChange={(event) => updateVariant(variant.id, {
                          priceOverride: event.target.value ? Number(event.target.value) : null,
                        })}
                        className="mt-0.5 h-8 border-dashboard-border bg-dashboard-bg text-sm"
                      />
                    </div>
                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => onChange(value.filter((item) => item.id !== variant.id))}
                        className="rounded-lg p-2 text-dashboard-muted hover:bg-dashboard-surface-elevated hover:text-destructive"
                        aria-label={`Remove ${color} ${variant.size}`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-dashboard-border px-4 py-6 text-center text-sm text-dashboard-muted">
          Select colors and sizes to create variant combinations.
        </p>
      )}
    </div>
  );
}
