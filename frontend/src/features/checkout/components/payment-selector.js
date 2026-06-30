'use client';

import { CreditCard, Smartphone, Wallet } from 'lucide-react';
import { PAYMENT_METHODS } from '@/features/checkout/constants/checkout.constants';
import { cn } from '@/utils/cn';

const ICONS = {
  COD: Wallet,
  UPI: Smartphone,
  CREDIT_CARD: CreditCard,
  DEBIT_CARD: CreditCard,
  NET_BANKING: CreditCard,
  WALLET: Wallet,
};

export function PaymentSelector({ value, onChange }) {
  return (
    <div className="grid gap-3">
      {PAYMENT_METHODS.map((method) => {
        const Icon = ICONS[method.id] || CreditCard;
        const selected = value === method.id;

        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onChange(method.id)}
            className={cn(
              'flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all',
              selected
                ? 'border-primary/50 bg-primary/10 shadow-[0_0_24px_rgba(124,58,237,0.2)]'
                : 'border-dashboard-border bg-dashboard-surface hover:border-primary/30',
            )}
          >
            <span className={cn('mt-0.5 flex size-10 items-center justify-center rounded-xl', selected ? 'bg-primary text-white' : 'bg-dashboard-surface-elevated text-dashboard-muted')}>
              <Icon className="size-5" />
            </span>
            <span>
              <span className="block font-semibold text-dashboard-foreground">{method.label}</span>
              <span className="mt-1 block text-sm text-dashboard-muted">{method.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
