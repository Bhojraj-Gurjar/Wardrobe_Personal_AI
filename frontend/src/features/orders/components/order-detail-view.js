'use client';

import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@/constants/routes';
import { QUERY_STALE_TIME } from '@/constants/app';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { OrderTimeline, StatusBadge } from '@/features/orders/components/order-timeline';
import { fetchOrderById } from '@/features/orders/services/orders.service';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import { useOrderEvents } from '@/features/orders/hooks/use-order-events';
import { useAuthStore } from '@/stores/auth-store';

export function OrderDetailView({ orderId }) {
  const token = useAuthStore((state) => state.accessToken);

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderById(orderId, token),
    enabled: Boolean(token && orderId),
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });

  useOrderEvents({ enabled: Boolean(token && orderId) });

  const order = orderQuery.data;
  const invoice = order?.documents?.find((doc) => doc.document_type === 'INVOICE');

  if (orderQuery.isLoading) {
    return <LoadingState title="Loading order…" />;
  }

  if (orderQuery.isError || !order) {
    return <ErrorState title="Order not found" onRetry={() => orderQuery.refetch()} />;
  }

  const address = order.shipping_address || {};

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Link href={ROUTES.ORDERS} className="inline-flex items-center gap-2 text-sm text-dashboard-muted hover:text-dashboard-foreground">
        <ArrowLeft className="size-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dashboard-foreground">{order.order_number}</h1>
          <p className="mt-1 text-sm text-dashboard-muted">Placed {new Date(order.created_at).toLocaleString('en-IN')}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-3xl border border-dashboard-border bg-dashboard-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-dashboard-foreground">Order Progress</h2>
          <OrderTimeline order={order} />
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-dashboard-border bg-dashboard-surface p-5">
            <h3 className="font-semibold text-dashboard-foreground">Order Summary</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-dashboard-muted">Total</dt><dd className="font-semibold">{formatProductPrice(order.total_amount)}</dd></div>
              <div className="flex justify-between"><dt className="text-dashboard-muted">Payment</dt><dd>{order.payment_method}</dd></div>
              {order.estimated_delivery ? (
                <div className="flex justify-between"><dt className="text-dashboard-muted">ETA</dt><dd>{new Date(order.estimated_delivery).toLocaleDateString('en-IN')}</dd></div>
              ) : null}
            </dl>
            {invoice?.public_url ? (
              <Button asChild variant="outline" className="mt-4 w-full">
                <a href={invoice.public_url} target="_blank" rel="noreferrer">
                  <Download className="size-4" /> Download Invoice
                </a>
              </Button>
            ) : null}
          </div>

          <div className="rounded-3xl border border-dashboard-border bg-dashboard-surface p-5">
            <h3 className="font-semibold text-dashboard-foreground">Shipping Address</h3>
            <p className="mt-2 text-sm text-dashboard-muted">
              {address.full_name}<br />
              {address.house_no}, {address.city}<br />
              {address.state} {address.pincode}<br />
              {address.phone}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
