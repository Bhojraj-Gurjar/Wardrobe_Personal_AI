'use client';

import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import {
  CMS_FASHION_COLORS,
  getSizesForProductType,
} from '../constants/cms-taxonomy';
import { WizardFieldLabel } from './wizard-field-label';
import { wizardInputClass, wizardSelectClass } from './wizard-form-styles';

export type AddVariantSpec = {
  type: 'color' | 'size';
  value: string;
  sellingPrice: number;
  stock: number;
};

type AddProductVariantModalProps = {
  open: boolean;
  onClose: () => void;
  productType: string;
  onSubmit: (spec: AddVariantSpec) => Promise<void>;
  isSubmitting?: boolean;
};

function parseRequiredNumber(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be zero or greater.`);
  }

  return parsed;
}

export function AddProductVariantModal({
  open,
  onClose,
  productType,
  onSubmit,
  isSubmitting,
}: AddProductVariantModalProps) {
  const [variantType, setVariantType] = useState<'color' | 'size'>('color');
  const [value, setValue] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const colorOptions = CMS_FASHION_COLORS;
  const sizeOptions = getSizesForProductType(productType);

  const resetForm = () => {
    setVariantType('color');
    setValue('');
    setCustomValue('');
    setSellingPrice('');
    setStock('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      const resolvedValue = (value === '__custom__' ? customValue : value).trim();
      if (!resolvedValue) {
        throw new Error(`Select or enter a ${variantType}.`);
      }

      await onSubmit({
        type: variantType,
        value: resolvedValue,
        sellingPrice: parseRequiredNumber(sellingPrice, 'Selling price'),
        stock: parseRequiredNumber(stock, 'Stock'),
      });
      resetForm();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create variant product.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-variant-title"
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1224]/95 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 id="add-variant-title" className="text-lg font-semibold text-white">Add Variant Product</h4>
            <p className="mt-1 text-sm text-slate-400">
              Creates a separate product record that inherits shared details from this wizard.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-white/10 p-2 text-slate-400 transition-colors hover:border-purple-500/40 hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {(['color', 'size'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setVariantType(type);
                setValue('');
                setCustomValue('');
              }}
              className={cn(
                'rounded-xl border px-4 py-3 text-sm font-medium capitalize transition-colors',
                variantType === type
                  ? 'border-purple-500/70 bg-purple-500/15 text-purple-200'
                  : 'border-white/10 bg-[#111827]/40 text-slate-400 hover:border-purple-500/40 hover:text-white',
              )}
            >
              {type} variant
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <WizardFieldLabel required>
              {variantType === 'color' ? 'Color' : 'Size'}
            </WizardFieldLabel>
            <select
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className={wizardSelectClass}
            >
              <option value="" className="bg-[#0d1224] text-white/60">
                Select {variantType}
              </option>
              {(variantType === 'color' ? colorOptions : sizeOptions).map((option) => (
                <option key={option} value={option} className="bg-[#0d1224] text-white">{option}</option>
              ))}
              <option value="__custom__" className="bg-[#0d1224] text-white">Custom…</option>
            </select>
          </div>

          {value === '__custom__' ? (
            <div>
              <WizardFieldLabel required>Custom {variantType}</WizardFieldLabel>
              <Input
                value={customValue}
                onChange={(event) => setCustomValue(event.target.value)}
                placeholder={`Enter ${variantType}`}
                className={wizardInputClass}
              />
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <WizardFieldLabel required>Selling Price</WizardFieldLabel>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0"
                value={sellingPrice}
                onChange={(event) => setSellingPrice(event.target.value)}
                className={wizardInputClass}
              />
            </div>
            <div>
              <WizardFieldLabel required>Stock</WizardFieldLabel>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                className={wizardInputClass}
              />
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose} className="text-slate-400 hover:text-white">
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="gap-2 rounded-xl bg-primary px-5 shadow-[0_8px_24px_rgba(139,92,246,0.35)]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Creating…
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Create Variant Product
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
