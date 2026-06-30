'use client';

import { Layers, Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import {
  OUTFIT_SLOT_LABELS,
  OUTFIT_SLOTS,
} from '../constants/outfit-builder.constants';
import {
  formatPrice,
  getSelectedOutfitProducts,
  resolveOutfitCurrency,
} from '../utils/outfit-builder.util';

const SLOT_ORDER = [
  OUTFIT_SLOTS.TSHIRT,
  OUTFIT_SLOTS.SHIRT,
  OUTFIT_SLOTS.JACKET,
  OUTFIT_SLOTS.PANTS,
  OUTFIT_SLOTS.SHOES,
];

export function CurrentOutfitCard({
  outfit,
  totalValue,
  onShopLook,
  isShopping = false,
  shopError = null,
  className,
}) {
  const selectedCount = getSelectedOutfitProducts(outfit).length;
  const currency = resolveOutfitCurrency(outfit);
  const canShop = selectedCount > 0 && !isShopping;

  return (
    <div
      className={cn(
        'rounded-[28px] border border-white/10 bg-[#111827] p-6',
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <Layers className="size-5 text-[#8B5CF6]" />
        <h3 className="text-lg font-semibold text-dashboard-foreground">
          Current Outfit
        </h3>
      </div>

      <div className="space-y-3">
        {SLOT_ORDER.map((slot) => {
          const item = outfit?.[slot];

          return (
            <div
              key={slot}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/6 bg-[#0B1020] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="size-3 rounded-full border border-white/15"
                  style={{ backgroundColor: item?.color || '#8B5CF6' }}
                />
                <div>
                  <p className="text-xs uppercase tracking-wider text-dashboard-muted">
                    {OUTFIT_SLOT_LABELS[slot]}
                  </p>
                  <p className="text-sm font-medium text-dashboard-foreground">
                    {item?.title || 'Not selected'}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-dashboard-foreground">
                {item ? formatPrice(item.price, item.currency || currency) : '—'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-dashboard-muted">
            Total Look Value
          </p>
          <p className="text-2xl font-bold text-dashboard-foreground">
            {formatPrice(totalValue, currency)}
          </p>
          <p className="mt-1 text-xs text-dashboard-muted">
            {selectedCount
              ? `${selectedCount} item${selectedCount === 1 ? '' : 's'} selected`
              : 'Select items to build your look'}
          </p>
        </div>
      </div>

      {shopError ? (
        <p className="mt-3 text-center text-sm text-red-400" role="alert">
          {shopError}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={onShopLook}
        disabled={!canShop}
        className="mt-4 h-12 w-full rounded-2xl bg-[#8B5CF6] text-white hover:bg-[#7C3AED] disabled:opacity-50"
      >
        {isShopping ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Adding to cart…
          </>
        ) : (
          <>
            <ShoppingBag className="mr-2 size-4" />
            Shop This Look
          </>
        )}
      </Button>
    </div>
  );
}
