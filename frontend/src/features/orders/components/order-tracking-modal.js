'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Download,
  Headphones,
  Loader2,
  MapPin,
  X,
} from 'lucide-react';
import { QUERY_STALE_TIME } from '@/constants/app';
import { ROUTES } from '@/constants/routes';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderTrackingTimeline } from '@/features/orders/components/order-tracking-timeline';
import { StatusBadge } from '@/features/orders/components/order-timeline';
import { fetchOrderById } from '@/features/orders/services/orders.service';
import { useOrderEvents } from '@/features/orders/hooks/use-order-events';
import { formatOrderDate, resolveOrderStatusConfig } from '@/features/orders/utils/order-status';
import {
  collectOrderSkus,
  formatTrackingDateTime,
  resolveCancellationDetails,
  resolveLiveDeliveryInfo,
  resolveRefundDetails,
  resolveTrackingMode,
} from '@/features/orders/utils/order-tracking.utils';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';
import { cn } from '@/utils/cn';

function TrackingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="text-dashboard-muted">{label}</dt>
      <dd className="max-w-[60%] text-right font-medium text-dashboard-foreground">{value || '—'}</dd>
    </div>
  );
}

function SectionCard({ title, children, className }) {
  return (
    <section className={cn('rounded-2xl border border-dashboard-border/70 bg-dashboard-bg/30 p-4 md:p-5', className)}>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-dashboard-muted">{title}</h3>
      {children}
    </section>
  );
}

export function OrderTrackingModal({ orderId, open, onClose, initialOrder = null }) {
  const token = useUserAccessToken();
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  useOrderEvents({ enabled: open && Boolean(token) });

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderById(orderId, token),
    enabled: open && Boolean(orderId && token),
    initialData: initialOrder?.id === orderId ? initialOrder : undefined,
    staleTime: QUERY_STALE_TIME.SHORT,
    retry: 2,
    refetchOnWindowFocus: true,
  });

  const order = orderQuery.data;
  const invoice = order?.documents?.find((doc) => doc.document_type === 'INVOICE');
  const address = order?.shipping_address || {};
  const skus = order ? collectOrderSkus(order) : [];
  const trackingMode = order ? resolveTrackingMode(order) : 'fulfillment';
  const liveInfo = order ? resolveLiveDeliveryInfo(order) : null;
  const cancellation = order && trackingMode === 'cancelled' ? resolveCancellationDetails(order) : null;
  const refund = order && trackingMode === 'return' ? resolveRefundDetails(order) : null;
  const statusConfig = order ? resolveOrderStatusConfig(order.status) : null;
  const etaFormatted = order?.estimated_delivery
    ? formatTrackingDateTime(order.estimated_delivery).date
    : '—';

  async function handleInvoiceDownload() {
    if (!invoice?.public_url) {
      return;
    }

    setInvoiceLoading(true);

    try {
      window.open(invoice.public_url, '_blank', 'noopener,noreferrer');
    } finally {
      window.setTimeout(() => setInvoiceLoading(false), 600);
    }
  }

  return (
    <AnimatePresence>
      {open && orderId ? (
        <>
          <motion.button
            type="button"
            aria-label="Close tracking"
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-tracking-title"
            className="fixed inset-x-3 top-[4vh] z-[90] mx-auto flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0B1020]/95 shadow-2xl backdrop-blur-xl sm:inset-x-6"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-dashboard-border/60 px-5 py-4 md:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Track Order</p>
                <h2 id="order-tracking-title" className="mt-1 truncate text-xl font-bold text-white md:text-2xl">
                  {order?.order_number || 'Loading…'}
                </h2>
                {order ? (
                  <p className="mt-1 text-sm text-dashboard-muted">
                    Placed {formatOrderDate(order.created_at)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-dashboard-muted transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
              {orderQuery.isLoading && !order ? (
                <TrackingSkeleton />
              ) : orderQuery.isError || !order ? (
                <ErrorState
                  title="Tracking unavailable"
                  description="We couldn't load this order right now."
                  onRetry={() => orderQuery.refetch()}
                />
              ) : (
                <div className="space-y-5">
                  <SectionCard title="Order Overview" className="bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <StatusBadge status={order.status} />
                      <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', statusConfig?.badgeClass)}>
                        {order.display_status || statusConfig?.label}
                      </span>
                    </div>
                    <dl className="grid gap-3 md:grid-cols-2">
                      <InfoRow label="Order ID" value={order.order_number} />
                      <InfoRow label="SKU IDs" value={skus.length ? skus.join(', ') : '—'} />
                      <InfoRow label="Order Date" value={formatOrderDate(order.created_at)} />
                      <InfoRow label="Estimated Delivery" value={etaFormatted} />
                      <InfoRow label="Payment Status" value={order.payment_status} />
                      <InfoRow label="Payment Method" value={order.payment_method} />
                      <InfoRow label="Total Amount" value={formatProductPrice(order.total_amount, order.currency)} />
                      <InfoRow label="Items" value={`${order.item_count ?? order.items?.length ?? 0}`} />
                    </dl>
                  </SectionCard>

                  <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                    <SectionCard title="Delivery Journey">
                      <OrderTrackingTimeline order={order} />
                    </SectionCard>

                    <div className="space-y-5">
                      <SectionCard title="Shipment Information">
                        <dl className="space-y-3">
                          <InfoRow
                            label="Customer"
                            value={address.full_name || order.user?.name}
                          />
                          <InfoRow label="Phone" value={address.phone || order.user?.mobile} />
                          <InfoRow
                            label="Shipping Address"
                            value={[
                              address.house_no || address.address_line1,
                              address.city,
                              address.state,
                              address.pincode,
                            ].filter(Boolean).join(', ')}
                          />
                          <InfoRow label="Delivery Partner" value={order.courier_name} />
                          <InfoRow label="Tracking Number" value={order.tracking_number} />
                          <InfoRow label="Package Weight" value={order.package_weight ? `${order.package_weight} kg` : null} />
                        </dl>
                        {invoice?.public_url ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-4 w-full"
                            disabled={invoiceLoading}
                            onClick={handleInvoiceDownload}
                          >
                            {invoiceLoading ? (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                              <Download className="mr-2 size-4" />
                            )}
                            Download Invoice
                          </Button>
                        ) : null}
                      </SectionCard>

                      <SectionCard title="Live Delivery">
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-3 rounded-xl border border-dashboard-border/60 bg-dashboard-surface/40 p-3">
                            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                            <div>
                              <p className="font-medium text-dashboard-foreground">Current Location</p>
                              <p className="mt-1 text-dashboard-muted">
                                {liveInfo?.currentLocation
                                  || (order.status === 'SHIPPED' ? 'In transit with courier' : 'Will update when shipment is active')}
                              </p>
                            </div>
                          </div>
                          <InfoRow
                            label="Last Updated"
                            value={liveInfo?.lastUpdated
                              ? `${formatTrackingDateTime(liveInfo.lastUpdated).date} · ${formatTrackingDateTime(liveInfo.lastUpdated).time}`
                              : '—'}
                          />
                          <InfoRow
                            label="Estimated Delivery"
                            value={liveInfo?.estimatedDelivery
                              ? formatTrackingDateTime(liveInfo.estimatedDelivery).date
                              : '—'}
                          />
                          <InfoRow label="Delivery Window" value={liveInfo?.deliveryWindow} />
                          <InfoRow label="Courier Contact" value={liveInfo?.courierContact} />
                        </div>
                      </SectionCard>
                    </div>
                  </div>

                  {trackingMode === 'cancelled' && cancellation ? (
                    <SectionCard title="Cancellation Details" className="border-red-500/20 bg-red-500/5">
                      <dl className="space-y-3">
                        <InfoRow label="Cancellation Reason" value={cancellation.reason} />
                        <InfoRow label="Cancelled By" value={cancellation.cancelledBy} />
                        <InfoRow
                          label="Cancelled On"
                          value={cancellation.cancelledAt
                            ? `${formatTrackingDateTime(cancellation.cancelledAt).date} · ${formatTrackingDateTime(cancellation.cancelledAt).time}`
                            : '—'}
                        />
                        <InfoRow label="Refund Status" value={order.payment_status === 'refunded' ? 'Refunded' : 'Pending review'} />
                      </dl>
                    </SectionCard>
                  ) : null}

                  {trackingMode === 'return' && refund ? (
                    <SectionCard title="Return & Refund">
                      <dl className="space-y-3">
                        <InfoRow label="Refund Amount" value={formatProductPrice(refund.amount, order.currency)} />
                        <InfoRow label="Refund Method" value={refund.method} />
                        <InfoRow label="Transaction ID" value={refund.transactionId} />
                        <InfoRow
                          label="Refund Date"
                          value={refund.date
                            ? `${formatTrackingDateTime(refund.date).date} · ${formatTrackingDateTime(refund.date).time}`
                            : '—'}
                        />
                        <InfoRow label="Refund Status" value={refund.status} />
                      </dl>
                    </SectionCard>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-dashboard-border/60 px-5 py-4 md:px-6">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
              >
                <Link href={`${ROUTES.SUPPORT.NEW}?order_reference=${encodeURIComponent(order?.order_number || '')}`}>
                  <Headphones className="mr-2 size-4" />
                  Contact Support
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-dashboard-border/80 bg-transparent text-dashboard-foreground hover:bg-white/10"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
