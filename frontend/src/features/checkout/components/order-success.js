'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import { Button } from '@/components/ui/button';
import { faceAuthPrimaryButtonClass } from '@/features/face/components/face-auth-layout';
import { cn } from '@/utils/cn';

export function OrderSuccess({ order }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-primary/20 bg-dashboard-surface p-8 text-center shadow-[0_0_40px_rgba(124,58,237,0.15)]">
      <span className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
        <CheckCircle2 className="size-8" />
      </span>
      <h1 className="text-2xl font-bold text-dashboard-foreground">Order Successfully Placed</h1>
      <p className="mt-2 text-sm text-dashboard-muted">
        Thank you! Your order <strong className="text-dashboard-foreground">{order?.order_number}</strong> is confirmed.
      </p>
      <dl className="mt-6 w-full space-y-2 rounded-2xl border border-dashboard-border bg-dashboard-surface-elevated p-4 text-left text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-dashboard-muted">Total</dt>
          <dd className="font-semibold text-dashboard-foreground">{formatProductPrice(order?.total_amount)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-dashboard-muted">Payment</dt>
          <dd className="text-dashboard-foreground">{order?.payment_method || 'COD'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-dashboard-muted">Status</dt>
          <dd className="text-dashboard-foreground">{order?.display_status || 'New Order'}</dd>
        </div>
      </dl>
      <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
        <Button asChild className={cn(faceAuthPrimaryButtonClass, 'h-12 flex-1')}>
          <Link href={order?.id ? ROUTES.ORDERS_BY_ID(order.id) : ROUTES.ORDERS}>Track Order</Link>
        </Button>
        <Button asChild variant="glass" className="h-12 flex-1">
          <Link href={ROUTES.PRODUCTS.LIST}>Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
