'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';

export function QuantitySelector({ quantity, onChange, min = 1, max = 10 }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Quantity</h3>
      <div className="inline-flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={quantity <= min}
          onClick={() => onChange(Math.max(min, quantity - 1))}
          className={cn(
            'flex size-11 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/[0.06] hover:text-white',
            quantity <= min && 'opacity-40',
          )}
        >
          <Minus className="size-4" />
        </button>
        <span className="min-w-12 text-center text-base font-semibold text-white">{quantity}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          disabled={quantity >= max}
          onClick={() => onChange(Math.min(max, quantity + 1))}
          className={cn(
            'flex size-11 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/[0.06] hover:text-white',
            quantity >= max && 'opacity-40',
          )}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
