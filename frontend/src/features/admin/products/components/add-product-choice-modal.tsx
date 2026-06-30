'use client';

import { Package, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

type AddProductChoiceModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectSingle: () => void;
  onSelectBulk: () => void;
};

export function AddProductChoiceModal({
  open,
  onClose,
  onSelectSingle,
  onSelectBulk,
}: AddProductChoiceModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-dashboard-border bg-dashboard-surface p-6 shadow-2xl">
        <h3 className="text-xl font-semibold text-dashboard-foreground">Add Product</h3>
        <p className="mt-1 text-sm text-dashboard-muted">Choose how you want to add products to the catalog.</p>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={onSelectSingle}
            className={cn(
              'flex items-start gap-4 rounded-xl border border-dashboard-border bg-dashboard-bg/40 p-4 text-left transition-colors hover:border-primary hover:bg-primary/5',
            )}
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Package className="size-5" />
            </span>
            <span>
              <span className="block font-semibold text-dashboard-foreground">Single Product</span>
              <span className="mt-1 block text-sm text-dashboard-muted">
                Multi-step form with images, variants, pricing, and AI attributes.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onSelectBulk}
            className="flex items-start gap-4 rounded-xl border border-dashboard-border bg-dashboard-bg/40 p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Upload className="size-5" />
            </span>
            <span>
              <span className="block font-semibold text-dashboard-foreground">Bulk Upload</span>
              <span className="mt-1 block text-sm text-dashboard-muted">
                Import CSV or Excel with row-level validation before publishing.
              </span>
            </span>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
