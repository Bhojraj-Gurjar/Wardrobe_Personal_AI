'use client';

import { useQuery } from '@tanstack/react-query';
import { Phone, X } from 'lucide-react';
import { fetchAdminOrderById } from '@/features/admin/services/admin.service';
import { useAdminToken } from '@/features/admin/hooks';
import {
  getLineItemName,
  getLineItemQty,
  getLineItemSize,
  getLineItemSku,
  getLineItemTotal,
} from '@/features/admin/utils/admin-oms-table.util';
import { StatusBadge } from '@/features/orders/components/order-timeline';
import { formatOrderDate } from '@/features/orders/utils/order-status';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import { cn } from '@/utils/cn';

function DetailRow({ label, value }) {
  if (value == null || value === '') {
    return null;
  }

  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium uppercase tracking-wide text-dashboard-muted">{label}</span>
      <span className="text-sm font-medium text-dashboard-foreground">{value}</span>
    </div>
  );
}

function AddressBlock({ title, address }) {
  if (!address) {
    return null;
  }

  return (
    <div className="rounded-xl border border-dashboard-border bg-dashboard-bg/40 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dashboard-muted">{title}</p>
      <p className="font-medium text-dashboard-foreground">{address.full_name || '—'}</p>
      {address.address_line1 ? <p className="mt-1 text-sm text-dashboard-muted">{address.address_line1}</p> : null}
      {address.address_line2 ? <p className="text-sm text-dashboard-muted">{address.address_line2}</p> : null}
      <p className="mt-1 text-sm text-dashboard-muted">
        {[address.city, address.state, address.pincode].filter(Boolean).join(', ')}
      </p>
      {address.phone ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-dashboard-muted">
          <Phone className="size-3.5" />
          {address.phone}
        </p>
      ) : null}
    </div>
  );
}

export function AdminOmsOrderDetailDrawer({ order, open, onClose }) {
  const token = useAdminToken();

  const detailQuery = useQuery({
    queryKey: ['admin-order', order?.id],
    queryFn: () => fetchAdminOrderById(order.id, token),
    enabled: Boolean(open && order?.id && token),
  });

  const activeOrder = detailQuery.data || order;

  if (!open || !activeOrder) {
    return null;
  }

  const currency = activeOrder.items?.[0]?.product?.currency;
  const customerPhone = activeOrder.user?.mobile || activeOrder.shipping_address?.phone;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        aria-label="Close order details"
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col',
          'border-l border-dashboard-border bg-[#0B1020] shadow-2xl',
        )}
      >
        <div className="flex items-start justify-between border-b border-dashboard-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-dashboard-muted">Order Details</p>
            <h2 className="mt-1 text-lg font-bold text-white">{activeOrder.order_number}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={activeOrder.status} />
              <span className="text-xs text-dashboard-muted">{formatOrderDate(activeOrder.created_at)}</span>
            </div>
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

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <section className="space-y-3 rounded-2xl border border-dashboard-border bg-dashboard-surface/40 p-4">
            <h3 className="text-sm font-semibold text-dashboard-foreground">Order Summary</h3>
            <DetailRow label="Total" value={formatProductPrice(activeOrder.total_amount, currency)} />
            <DetailRow label="Payment" value={activeOrder.payment_method || 'COD'} />
            <DetailRow label="Pay Status" value={activeOrder.payment_status || 'pending'} />
            <DetailRow
              label="Items"
              value={`${activeOrder.item_count || activeOrder.items?.length || 0} item(s)`}
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-dashboard-border bg-dashboard-surface/40 p-4">
            <h3 className="text-sm font-semibold text-dashboard-foreground">Customer</h3>
            <DetailRow label="Name" value={activeOrder.user?.name || '—'} />
            <DetailRow label="Phone" value={customerPhone || '—'} />
            <DetailRow label="Email" value={activeOrder.user?.email || '—'} />
          </section>

          <AddressBlock title="Shipping Address" address={activeOrder.shipping_address} />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-dashboard-foreground">Line Items</h3>
            <div className="overflow-hidden rounded-xl border border-dashboard-border">
              <table className="w-full text-sm">
                <thead className="bg-dashboard-surface-elevated/80 text-left text-[11px] font-semibold uppercase tracking-wide text-dashboard-muted">
                  <tr>
                    <th className="px-3 py-2.5">Product</th>
                    <th className="px-3 py-2.5">SKU</th>
                    <th className="px-3 py-2.5 text-center">Qty</th>
                    <th className="px-3 py-2.5 text-center">Size</th>
                    <th className="px-3 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeOrder.items || []).map((item) => (
                    <tr key={item.id} className="border-t border-dashboard-border/70">
                      <td className="px-3 py-3 align-top">
                        <p className="font-medium text-dashboard-foreground">{getLineItemName(item)}</p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="break-all font-mono text-[11px] text-primary/90">{getLineItemSku(item)}</span>
                      </td>
                      <td className="px-3 py-3 text-center align-top tabular-nums text-dashboard-muted">
                        {getLineItemQty(item, activeOrder)}
                      </td>
                      <td className="px-3 py-3 text-center align-top text-dashboard-muted">
                        {getLineItemSize(item)}
                      </td>
                      <td className="px-3 py-3 text-right align-top font-medium tabular-nums text-dashboard-foreground">
                        {formatProductPrice(getLineItemTotal(item, activeOrder), currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
