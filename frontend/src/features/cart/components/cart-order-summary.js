'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

export const CartOrderSummary = forwardRef(function CartOrderSummary({
  summary = {},
  promoInput = '',
  onPromoInputChange,
  onApplyPromo,
  onCheckout,
  checkoutLoading = false,
  checkoutError = null,
  promoError = null,
  highlightCheckout = false,
  className,
}, ref) {
  const subtotal = formatProductPrice(summary.subtotal);
  const discount = summary.discount > 0 ? formatProductPrice(summary.discount) : null;
  const shippingValue = Number(summary.shipping ?? 0);
  const shippingLabel =
    shippingValue === 0 ? 'Free' : formatProductPrice(shippingValue);
  const total = formatProductPrice(summary.total);

  return (
    <aside
      ref={ref}
      className={cn(
        'h-fit space-y-5 rounded-2xl border bg-dashboard-surface p-5 sm:p-6',
        highlightCheckout
          ? 'border-primary/40 shadow-[0_0_0_1px_rgba(139,92,246,0.35),0_0_28px_-4px_rgba(124,58,237,0.35)]'
          : 'border-dashboard-border',
        className,
      )}
    >
      <h2 className="text-lg font-bold text-dashboard-foreground">Order Summary</h2>

      <dl className="space-y-3 text-sm">
        {subtotal ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-dashboard-muted">Subtotal</dt>
            <dd className="font-medium text-dashboard-foreground">{subtotal}</dd>
          </div>
        ) : null}

        {discount ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-dashboard-muted">Discount</dt>
            <dd className="font-medium text-dashboard-success">-{discount}</dd>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <dt className="text-dashboard-muted">Shipping</dt>
          <dd
            className={cn(
              'font-medium',
              shippingValue === 0 ? 'text-dashboard-success' : 'text-dashboard-foreground',
            )}
          >
            {shippingLabel}
          </dd>
        </div>

        {total ? (
          <div className="flex items-center justify-between gap-4 border-t border-dashboard-border pt-4">
            <dt className="text-base font-bold text-dashboard-foreground">Total</dt>
            <dd className="text-xl font-bold text-dashboard-foreground">{total}</dd>
          </div>
        ) : null}
      </dl>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={promoInput}
            onChange={(event) => onPromoInputChange?.(event.target.value)}
            placeholder="Promo code"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            className={cn(
              'h-11 shrink-0 rounded-xl border-primary/40 px-4 text-primary',
              'hover:border-primary hover:bg-primary/10 hover:text-primary',
            )}
            onClick={onApplyPromo}
          >
            Apply
          </Button>
        </div>
        {promoError ? (
          <p className="text-xs text-destructive">{promoError}</p>
        ) : summary.appliedCoupon ? (
          <p className="text-xs text-dashboard-success">
            {summary.couponLabel || summary.appliedCoupon} applied
          </p>
        ) : null}
      </div>

      {checkoutError ? (
        <p className="text-xs text-destructive">{checkoutError}</p>
      ) : null}

      <Button
        type="button"
        className={cn(
          'h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20',
          'bg-primary text-primary-foreground hover:bg-primary/90',
        )}
        disabled={checkoutLoading}
        onClick={onCheckout}
      >
        {checkoutLoading ? 'Processing…' : 'Checkout'}
        <ArrowRight className="size-4" />
      </Button>

      <div className="text-center">
        <Link
          href={ROUTES.PRODUCTS.LIST}
          className="text-sm font-medium text-dashboard-muted transition-colors hover:text-primary"
        >
          Continue Shopping
        </Link>
      </div>
    </aside>
  );
});
