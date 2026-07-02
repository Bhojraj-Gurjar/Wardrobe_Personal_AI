'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  MapPin,
  Truck,
  XCircle,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ProductCardImage } from '@/features/products/components/product-card-image';
import {
  formatProductPrice,
  getProductImageUrl,
} from '@/features/products/utils/product-catalog.utils';
import {
  formatOrderDate,
  resolveOrderStatusConfig,
} from '@/features/orders/utils/order-status';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

const STATUS_ICONS = {
  DELIVERED: CheckCircle2,
  COMPLETED: CheckCircle2,
  SHIPPED: Truck,
  CANCELLED: XCircle,
  PENDING: Clock3,
  CREATED: Clock3,
  CONFIRMED: Clock3,
  PACKED: Clock3,
};

function OrderLineItem({ item }) {
  const product = item.product;
  const imageUrl = getProductImageUrl(product);
  const unitPrice = formatProductPrice(item.price, product?.currency);
  const lineTotal = formatProductPrice(
    (item.price ?? 0) * (item.quantity ?? 1),
    product?.currency,
  );

  return (
    <div className="flex items-center gap-4 border-t border-dashboard-border/70 px-4 py-4 sm:px-5">
      <Link
        href={product?.id ? ROUTES.PRODUCTS.DETAIL(product.id) : ROUTES.PRODUCTS.LIST}
        className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-dashboard-surface-elevated transition-transform hover:scale-105"
      >
        <ProductCardImage
          src={imageUrl}
          alt={product?.name || 'Product'}
          sizes="64px"
          imageClassName="object-cover"
        />
      </Link>

      <div className="min-w-0 flex-1">
        {product?.brand ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/90">
            {product.brand}
          </p>
        ) : null}
        <p className="truncate text-sm font-semibold text-dashboard-foreground">
          {product?.name || 'Product'}
        </p>
        <p className="mt-1 text-xs text-dashboard-muted">
          Qty {item.quantity}
          {unitPrice ? ` · ${unitPrice} each` : ''}
        </p>
      </div>

      <p className="shrink-0 text-sm font-bold text-dashboard-foreground">{lineTotal}</p>
    </div>
  );
}

function resolveDeliveryTimestamp(order) {
  return order.delivered_at || order.completed_at || order.delivery_date || order.updated_at || order.updatedAt;
}

function isWithinReturnWindow(order) {
  const deliveryTimestamp = resolveDeliveryTimestamp(order);
  if (!deliveryTimestamp) {
    return false;
  }

  const deliveryTime = new Date(deliveryTimestamp).getTime();
  const currentTime = Date.now();
  const hoursSinceDelivery = (currentTime - deliveryTime) / (1000 * 60 * 60);

  return hoursSinceDelivery <= 24;
}

function handleReturnOrder(order, onReturn) {
  if (onReturn) {
    onReturn(order);
    return;
  }

  const confirmed = window.confirm(
    `Request a return for order ${order.order_number}? Our team will follow up shortly.`,
  );

  if (confirmed) {
    window.location.href = `mailto:support@wardrobe.ai?subject=${encodeURIComponent(
      `Return Request - ${order.order_number}`,
    )}`;
  }
}

export function OrderHistoryCard({ order, onReturn, onTrack, onCancel, isCancelling = false }) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = resolveOrderStatusConfig(order.status);
  const StatusIcon = STATUS_ICONS[order.status] || Clock3;
  const total = formatProductPrice(order.total_amount, order.items?.[0]?.product?.currency);
  const itemCount = order.item_count ?? order.items?.length ?? 0;
  const items = order.items ?? [];
  const isDelivered = ['DELIVERED', 'COMPLETED'].includes(order.status);
  const isWithin24Hours = isDelivered && isWithinReturnWindow(order);
  const canCancel = Boolean(order.can_cancel);

  return (
    <article className="interactive-card overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface">
      <button
        type="button"
        className="flex w-full items-center gap-4 p-4 text-left transition-all duration-200 hover:bg-dashboard-bg/40 sm:gap-5 sm:p-5"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-full',
            order.status === 'DELIVERED' || order.status === 'COMPLETED'
              ? 'bg-emerald-500/15 text-emerald-400'
              : order.status === 'SHIPPED' && 'bg-sky-500/15 text-sky-400',
            order.status === 'CANCELLED' && 'bg-red-500/15 text-red-400',
            !['DELIVERED', 'COMPLETED', 'SHIPPED', 'CANCELLED'].includes(order.status)
              && 'bg-amber-500/15 text-amber-400',
          )}
        >
          <StatusIcon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-dashboard-foreground">
              {order.order_number}
            </h3>
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                statusConfig.badgeClass,
              )}
            >
              {order.display_status || statusConfig.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-dashboard-muted">
            {formatOrderDate(order.created_at)}
            {' · '}
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <p className="text-xl font-bold text-dashboard-foreground">{total}</p>
          <ChevronDown
            className={cn(
              'size-5 shrink-0 text-dashboard-muted transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </div>
      </button>

      {expanded ? (
        <div className="bg-dashboard-bg/20">
          {items.map((item) => (
            <OrderLineItem key={item.id} item={item} />
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashboard-border/70 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-primary/40 text-primary hover:bg-primary/10"
                onClick={(event) => {
                  event.stopPropagation();
                  onTrack?.(order);
                }}
              >
                <MapPin className="mr-2 size-4" />
                Track Order
              </Button>
              {canCancel ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCancelling}
                  className="rounded-xl border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-60"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCancel?.(order.id);
                  }}
                >
                  <XCircle className="mr-2 size-4" />
                  {isCancelling ? 'Cancelling…' : 'Cancel Order'}
                </Button>
              ) : null}
            </div>
            {isDelivered ? (
              isWithin24Hours ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-primary/40 text-primary hover:bg-primary/10"
                  onClick={() => handleReturnOrder(order, onReturn)}
                >
                  Return Order
                </Button>
              ) : (
                <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Order Completed
                </span>
              )
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
