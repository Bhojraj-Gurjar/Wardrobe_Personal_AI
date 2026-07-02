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
import { buildVariantSku } from '../utils/sku.util';
import { WizardFieldLabel } from './wizard-field-label';
import { wizardInputClass } from './wizard-form-styles';

export type VariantRow = {
  id: string;
  color: string;
  size: string;
  stock?: number;
  sku?: string;
  priceOverride?: number | null;
};

type VariantSelectorProps = {
  productType: string;
  value: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
  baseSku?: string;
  stockError?: string;
};

function createVariantId() {
  return `var-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseStockInput(value: string) {
  if (value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : undefined;
}

export function VariantSelector({
  productType,
  value,
  onChange,
  baseSku,
  stockError,
}: VariantSelectorProps) {
  const [customColor, setCustomColor] = useState('');
  const [activeColor, setActiveColor] = useState(CMS_FASHION_COLORS[0]);
  const [colors, setColors] = useState<string[]>([...CMS_FASHION_COLORS]);
  const sizes = useMemo(() => getSizesForProductType(productType), [productType]);

  const simpleVariant = value.length === 1 ? value[0] : null;
  const isMultiVariant = value.length > 1;
  const simpleColor = simpleVariant?.color || activeColor;

  const variantsByColor = useMemo(() => {
    const map = new Map<string, VariantRow[]>();
    for (const variant of value) {
      const list = map.get(variant.color) || [];
      list.push(variant);
      map.set(variant.color, list);
    }
    return map;
  }, [value]);

  const upsertSimpleVariant = (color: string, size: string, stock?: number) => {
    const existing = value[0];
    const nextVariant: VariantRow = {
      id: existing?.id ?? createVariantId(),
      color,
      size,
      stock: stock ?? existing?.stock,
      sku: buildVariantSku(baseSku || '', color, size),
      priceOverride: existing?.priceOverride ?? null,
    };
    onChange([nextVariant]);
  };

  const toggleSize = (color: string, size: string) => {
    const existing = value.find((variant) => variant.color === color && variant.size === size);
    if (existing) {
      onChange(value.filter((variant) => variant.id !== existing.id));
      return;
    }

    onChange([
      ...value,
      {
        id: createVariantId(),
        color,
        size,
        stock: undefined,
        sku: buildVariantSku(baseSku || '', color, size),
      },
    ]);
  };

  const selectSimpleSize = (color: string, size: string) => {
    if (simpleVariant?.size === size) {
      onChange([]);
      return;
    }

    if (simpleVariant && simpleVariant.size !== size) {
      onChange([
        simpleVariant,
        {
          id: createVariantId(),
          color,
          size,
          stock: undefined,
          sku: buildVariantSku(baseSku || '', color, size),
        },
      ]);
      return;
    }

    upsertSimpleVariant(color, size);
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
    if (value.length === 1) {
      upsertSimpleVariant(trimmed, value[0].size, value[0].stock);
    }
  };

  const handleColorSelect = (color: string) => {
    if (isMultiVariant) {
      setActiveColor(color);
      return;
    }

    if (simpleVariant) {
      upsertSimpleVariant(color, simpleVariant.size, simpleVariant.stock);
    } else if (sizes[0]) {
      upsertSimpleVariant(color, sizes[0]);
    }

    setActiveColor(color);
  };

  return (
    <div className="space-y-6">
      <div>
        <WizardFieldLabel required>Color</WizardFieldLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorSelect(color)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                (isMultiVariant ? activeColor : simpleColor) === color
                  ? 'border-purple-500/70 bg-purple-500/15 text-purple-200 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                  : 'border-white/10 bg-[#111827]/40 text-slate-400 hover:border-purple-500/40 hover:text-white',
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
            className={wizardInputClass}
          />
          <Button type="button" variant="outline" size="sm" onClick={addCustomColor} className="shrink-0 gap-1">
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      </div>

      <div>
        <WizardFieldLabel required>Size{isMultiVariant ? 's' : ''}</WizardFieldLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          {sizes.map((size) => {
            const selected = isMultiVariant
              ? value.some((variant) => variant.color === activeColor && variant.size === size)
              : simpleVariant?.size === size;

            return (
              <button
                key={size}
                type="button"
                onClick={() => {
                  if (isMultiVariant) {
                    toggleSize(activeColor, size);
                    return;
                  }
                  selectSimpleSize(simpleColor || colors[0], size);
                }}
                className={cn(
                  'min-w-10 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                  selected
                    ? 'border-purple-500 bg-purple-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.35)]'
                    : 'border-white/10 bg-[#111827]/40 text-slate-400 hover:border-purple-500/40 hover:text-white',
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
        {!isMultiVariant && sizes.length > 1 ? (
          <p className="mt-2 text-xs text-slate-500">
            Select multiple sizes to manage per-size stock in the variant table.
          </p>
        ) : null}
      </div>

      {!isMultiVariant && simpleVariant ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827]/40 p-4">
          <WizardFieldLabel required>Stock</WizardFieldLabel>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={simpleVariant.stock ?? ''}
            onChange={(event) => updateVariant(simpleVariant.id, { stock: parseStockInput(event.target.value) })}
            className={cn(wizardInputClass, 'mt-1.5 max-w-xs')}
          />
          {simpleVariant.sku ? (
            <p className="mt-2 text-xs text-slate-500">
              Variant SKU: <span className="font-medium text-slate-300">{simpleVariant.sku}</span>
            </p>
          ) : null}
          {stockError ? <p className="mt-1 text-xs text-destructive">{stockError}</p> : null}
        </div>
      ) : null}

      {isMultiVariant && value.length ? (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Variant inventory ({value.length} combinations)
          </p>
          {[...variantsByColor.entries()].map(([color, variants]) => (
            <div key={color} className="rounded-2xl border border-white/[0.08] bg-[#111827]/40 p-4">
              <p className="mb-3 text-sm font-semibold text-white">{color}</p>
              <div className="space-y-2">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="grid gap-3 rounded-xl border border-white/[0.06] bg-[#0d1224]/60 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                  >
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Size</p>
                      <p className="mt-0.5 text-sm font-medium text-white">{variant.size}</p>
                    </div>
                    <div>
                      <WizardFieldLabel required className="text-[10px] uppercase tracking-wide">
                        Stock
                      </WizardFieldLabel>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={variant.stock ?? ''}
                        onChange={(event) => updateVariant(variant.id, { stock: parseStockInput(event.target.value) })}
                        className={cn(wizardInputClass, 'mt-0.5 h-9 text-sm')}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Price override</p>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Optional"
                        value={variant.priceOverride ?? ''}
                        onChange={(event) => updateVariant(variant.id, {
                          priceOverride: event.target.value ? Number(event.target.value) : null,
                        })}
                        className={cn(wizardInputClass, 'mt-0.5 h-9 text-sm')}
                      />
                      {variant.sku ? (
                        <p className="mt-1 truncate text-[10px] text-slate-500">SKU: {variant.sku}</p>
                      ) : null}
                    </div>
                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => onChange(value.filter((item) => item.id !== variant.id))}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-destructive"
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
          {stockError ? <p className="text-xs text-destructive">{stockError}</p> : null}
        </div>
      ) : null}

      {!value.length ? (
        <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-500">
          Select a color and size to set inventory.
        </p>
      ) : null}
    </div>
  );
}
