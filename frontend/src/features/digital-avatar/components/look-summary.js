'use client';

import { Check, RefreshCw, Save, Shirt } from 'lucide-react';
import { cn } from '@/utils/cn';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { formatPrice, resolveOutfitCurrency } from '../utils/outfit-builder.util';

function formatSavedLabel(lastSavedAt) {
  if (!lastSavedAt) {
    return null;
  }

  const date = new Date(lastSavedAt);

  if (Number.isNaN(date.getTime())) {
    return 'Look saved';
  }

  return `Saved ${date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export function LookSummary({
  totalValue,
  outfit,
  onRandomize,
  onSaveLook,
  isBusy = false,
  isSaved = false,
  hasUnsavedChanges = false,
  lastSavedAt = null,
  className,
}) {
  const savedLabel = formatSavedLabel(lastSavedAt);
  const currency = resolveOutfitCurrency(outfit);
  const showSavedState = isSaved && !hasUnsavedChanges;

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-4 rounded-[20px] border border-white/10',
        'bg-white/5 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-purple-300">
          <Shirt className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dashboard-muted">
            Total Look Value
          </p>
          <p className="text-2xl font-bold text-dashboard-foreground">
            {formatPrice(totalValue, currency)}
            <span className="ml-1.5 text-sm font-medium text-dashboard-muted">
              total
            </span>
          </p>
          {savedLabel ? (
            <p
              className={cn(
                'mt-1 text-xs',
                hasUnsavedChanges ? 'text-amber-400' : 'text-emerald-400',
              )}
            >
              {hasUnsavedChanges ? 'Unsaved changes' : savedLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[280px] sm:flex-row">
        <SecondaryButton
          type="button"
          disabled={isBusy}
          onClick={onRandomize}
          className="!h-12 flex-1 sm:min-w-[132px]"
        >
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="size-4" aria-hidden="true" />
            Randomize
          </span>
        </SecondaryButton>

        {showSavedState ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={onSaveLook}
            className={cn(
              'inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl sm:min-w-[132px]',
              'bg-emerald-600 text-sm font-semibold text-white',
              'shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            <Check className="size-4" aria-hidden="true" />
            Look Saved
          </button>
        ) : (
          <PrimaryButton
            type="button"
            disabled={isBusy}
            onClick={onSaveLook}
            isLoading={isBusy}
            className="!h-12 flex-1 sm:min-w-[132px]"
          >
            <span className="inline-flex items-center gap-2">
              {!isBusy ? <Save className="size-4" aria-hidden="true" /> : null}
              Save Look
            </span>
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
