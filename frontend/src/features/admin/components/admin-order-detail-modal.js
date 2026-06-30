'use client';

import { ProductCardImage } from '@/features/products/components/product-card-image';
import { formatProductPrice, getProductImageUrl } from '@/features/products/utils/product-catalog.utils';
import {
  formatOrderDate,
  resolveOrderStatusConfig,
} from '@/features/orders/utils/order-status';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';

const DELETED_USER_LABEL = '[Deleted User]';

function resolveOrderUserDisplay(user) {
  if (!user?.name && !user?.email) {
    return {
      name: DELETED_USER_LABEL,
      email: 'Account removed',
    };
  }

  return {
    name: user?.name || DELETED_USER_LABEL,
    email: user?.email || 'Account removed',
  };
}

function AddressBlock({ address, user }) {
  if (address && typeof address === 'object') {
    const parts = [
      address.line1 || address.street,
      address.city,
      address.state,
      address.postalCode || address.pincode,
      address.country,
    ].filter(Boolean);

    if (parts.length) {
      return <p className="text-sm text-dashboard-foreground">{parts.join(', ')}</p>;
    }
  }

  if (user?.email) {
    return (
      <p className="text-sm text-dashboard-muted">
        Digital delivery · {user.email}
      </p>
    );
  }

  return <p className="text-sm text-dashboard-muted">Address not provided</p>;
}

export function AdminOrderDetailModal({ order, onClose, onChangeStatus, onCancel }) {
  if (!order) return null;

  const status = resolveOrderStatusConfig(order.status);
  const currency = order.items?.[0]?.product?.currency;
  const customer = resolveOrderUserDisplay(order.user);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
        aria-label="Close order details"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden',
          'rounded-2xl border border-dashboard-border bg-dashboard-surface shadow-2xl',
        )}
      >
        <div className="flex items-start justify-between border-b border-dashboard-border px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
              Order Details
            </p>
            <h2 className="mt-1 text-xl font-bold text-dashboard-foreground">
              {order.order_number}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                  status.badgeClass,
                )}
              >
                {order.display_status || status.label}
              </span>
              <span className="text-xs text-dashboard-muted">
                {formatOrderDate(order.created_at)}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-dashboard-muted hover:text-dashboard-foreground"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="grid gap-6 sm:grid-cols-2">
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                Customer
              </h3>
              <p className="font-medium text-dashboard-foreground">{customer.name}</p>
              <p className="text-sm text-dashboard-muted">{customer.email}</p>
              <p className="mt-1 text-xs text-primary">{order.user?.plan || 'Free'} plan</p>
            </section>
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                Shipping
              </h3>
              <AddressBlock address={order.shipping_address} user={order.user} />
              <p className="mt-2 text-xs text-dashboard-muted">
                Payment: {order.payment_method || 'Cash on Delivery'}
              </p>
            </section>
          </div>

          <section className="mt-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
              Products
            </h3>
            <div className="space-y-3">
              {(order.items || []).map((item) => (
                <div
                  key={item.id}
                  className="interactive-card flex items-center gap-4 rounded-xl border border-dashboard-border bg-dashboard-bg/40 p-3"
                >
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-dashboard-surface-elevated">
                    <ProductCardImage
                      src={getProductImageUrl(item.product)}
                      alt={item.product?.name || 'Product'}
                      sizes="56px"
                      imageClassName="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-dashboard-foreground">
                      {item.product?.name || 'Product'}
                    </p>
                    <p className="text-xs text-dashboard-muted">
                      Qty {item.quantity}
                      {' · '}
                      {formatProductPrice(item.price, currency)} each
                    </p>
                  </div>
                  <p className="text-sm font-bold text-dashboard-foreground">
                    {formatProductPrice(
                      (item.price ?? 0) * (item.quantity ?? 1),
                      currency,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-dashboard-border bg-dashboard-bg/30 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
              Price Breakdown
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-dashboard-muted">
                <span>Subtotal</span>
                <span className="text-dashboard-foreground">
                  {formatProductPrice(order.subtotal, currency)}
                </span>
              </div>
              <div className="flex justify-between text-dashboard-muted">
                <span>Shipping</span>
                <span className="text-dashboard-foreground">
                  {order.shipping === 0
                    ? 'Free'
                    : formatProductPrice(order.shipping, currency)}
                </span>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between text-dashboard-muted">
                  <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                  <span className="text-emerald-400">
                    -{formatProductPrice(order.discount, currency)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-dashboard-border pt-2 text-base font-bold text-dashboard-foreground">
                <span>Total</span>
                <span>{formatProductPrice(order.total_amount, currency)}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-dashboard-border px-6 py-4">
          <select
            className="h-10 rounded-xl border border-dashboard-border bg-dashboard-bg px-3 text-sm text-dashboard-foreground"
            value={order.status}
            onChange={(event) => onChangeStatus?.(order.id, event.target.value)}
          >
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="COMPLETED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          {order.status !== 'CANCELLED' && !['DELIVERED', 'COMPLETED'].includes(order.status) ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-red-500/40 text-red-400 hover:bg-red-500/10"
              onClick={() => onCancel?.(order.id)}
            >
              Cancel Order
            </Button>
          ) : null}
          <Button type="button" variant="secondary" className="ml-auto rounded-xl" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
