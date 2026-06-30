'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Mail, Phone, X } from 'lucide-react';
import { OrderTimeline } from '@/features/orders/components/order-timeline';
import { fetchAdminOrderById } from '@/features/admin/services/admin.service';
import { useAdminToken } from '@/features/admin/hooks';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function ActionButton({ children, onClick, disabled, variant = 'glass' }) {
  return (
    <Button type="button" size="sm" variant={variant} disabled={disabled} onClick={onClick} className="w-full justify-start">
      {children}
    </Button>
  );
}

function AddressBlock({ title, address }) {
  if (!address) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">{title}</p>
      <p className="font-medium text-white">{address.full_name}</p>
      <p>{address.address_line1}</p>
      {address.address_line2 ? <p>{address.address_line2}</p> : null}
      <p>{[address.city, address.state, address.pincode].filter(Boolean).join(', ')}</p>
      {address.phone ? <p className="mt-1 text-white/55">{address.phone}</p> : null}
    </div>
  );
}

function DocumentLink({ doc }) {
  if (!doc?.public_url) {
    return null;
  }

  return (
    <a
      href={doc.public_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-primary transition hover:bg-primary/15"
    >
      <span>{doc.document_type === 'INVOICE' ? 'Invoice PDF' : 'Shipping Label PDF'}</span>
      <Download className="size-4" />
    </a>
  );
}

export function AdminOrderDetailDrawer({ order, open, onClose, onAction, loading = false }) {
  const token = useAdminToken();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierName, setCourierName] = useState('');

  const detailQuery = useQuery({
    queryKey: ['admin-order', order?.id],
    queryFn: () => fetchAdminOrderById(order.id, token),
    enabled: Boolean(open && order?.id && token),
  });

  const activeOrder = detailQuery.data || order;

  useEffect(() => {
    setTrackingNumber(activeOrder?.tracking_number || '');
    setCourierName(activeOrder?.courier_name || '');
  }, [activeOrder?.id, activeOrder?.tracking_number, activeOrder?.courier_name]);

  if (!open || !activeOrder) {
    return null;
  }

  const flags = activeOrder.oms_flags || {};
  const checklist = activeOrder.oms_metadata?.packing_checklist || {};
  const invoice = activeOrder.documents?.find((doc) => doc.document_type === 'INVOICE');
  const label = activeOrder.documents?.find((doc) => doc.document_type === 'SHIPPING_LABEL');
  const customerEmail = activeOrder.user?.email;
  const customerPhone = activeOrder.user?.mobile;

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-dashboard-border bg-[#0B1020] shadow-2xl">
        <div className="flex items-center justify-between border-b border-dashboard-border px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">{activeOrder.order_number}</h2>
            <p className="text-sm text-white/55">{activeOrder.user?.name} · {activeOrder.user?.email}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white/55 hover:bg-white/10 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">Quick Actions</h3>
            <div className="grid gap-2">
              {activeOrder.status === 'CREATED' ? (
                <>
                  <ActionButton disabled={loading} variant="default" onClick={() => onAction('accept')}>Accept Order</ActionButton>
                  <ActionButton disabled={loading} onClick={() => onAction('hold')}>Hold</ActionButton>
                </>
              ) : null}
              {activeOrder.status === 'CONFIRMED' ? (
                <>
                  <ActionButton disabled={loading} onClick={() => onAction('quickMarkRtd')}>Mark RTD</ActionButton>
                  <DocumentLink doc={invoice} />
                  <DocumentLink doc={label} />
                  {!flags.invoice_generated ? (
                    <ActionButton disabled={loading} onClick={() => onAction('generateInvoice')}>Generate Invoice</ActionButton>
                  ) : null}
                  {!flags.label_generated ? (
                    <ActionButton disabled={loading} onClick={() => onAction('generateLabel')}>Generate Shipping Label</ActionButton>
                  ) : null}
                </>
              ) : null}
              {activeOrder.status === 'PACKING' ? (
                <>
                  <label className="flex items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={Boolean(checklist.items_verified)}
                      onChange={(e) => onAction('updatePackingChecklist', { ...checklist, items_verified: e.target.checked })}
                    />
                    Items verified
                  </label>
                  <Input
                    placeholder="Packaging type"
                    defaultValue={checklist.packaging_type || ''}
                    onBlur={(e) => onAction('updatePackingChecklist', { ...checklist, packaging_type: e.target.value })}
                  />
                  <ActionButton disabled={loading} variant="default" onClick={() => onAction('markPacked')}>Mark Packed</ActionButton>
                </>
              ) : null}
              {activeOrder.status === 'PACKED' ? (
                <ActionButton disabled={loading} onClick={() => onAction('markRtd', { package_weight: activeOrder.package_weight })}>
                  Mark RTD
                </ActionButton>
              ) : null}
              {activeOrder.status === 'READY_TO_DISPATCH' ? (
                <ActionButton
                  disabled={loading}
                  variant="default"
                  onClick={() => onAction('dispatchOrder', {
                    courier_name: courierName.trim() || activeOrder.courier_name || 'Manual Courier',
                    tracking_number: trackingNumber.trim() || activeOrder.tracking_number || `TRK-${activeOrder.order_number}`,
                  })}
                >
                  Dispatch Order
                </ActionButton>
              ) : null}
              {activeOrder.status === 'READY_FOR_HANDOVER' ? (
                <>
                  <Input placeholder="Courier name" value={courierName} onChange={(e) => setCourierName(e.target.value)} />
                  <Input placeholder="Tracking number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                  <ActionButton
                    disabled={loading}
                    variant="default"
                    onClick={() => onAction('dispatchOrder', {
                      courier_name: courierName.trim() || 'Manual Courier',
                      tracking_number: trackingNumber.trim() || `TRK-${activeOrder.order_number}`,
                    })}
                  >
                    Move to In Transit
                  </ActionButton>
                </>
              ) : null}
              {customerEmail ? (
                <a
                  href={`mailto:${customerEmail}?subject=Order ${activeOrder.order_number}`}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/75 hover:bg-white/5"
                >
                  <Mail className="size-4" /> Contact Customer
                </a>
              ) : null}
              {customerPhone ? (
                <a href={`tel:${customerPhone}`} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/75 hover:bg-white/5">
                  <Phone className="size-4" /> {customerPhone}
                </a>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">Timeline</h3>
            <OrderTimeline order={activeOrder} variant="admin" />
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">Products</h3>
            <ul className="space-y-3">
              {(activeOrder.items || []).map((item) => (
                <li key={item.id} className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                  {item.product?.images?.[0]?.url ? (
                    <img
                      src={item.product.images[0].url}
                      alt=""
                      className="size-14 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="size-14 rounded-lg bg-white/10" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{item.product?.name || 'Product'}</p>
                    <p className="text-sm text-white/55">Qty {item.quantity} · {formatProductPrice(item.price)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <AddressBlock title="Shipping Address" address={activeOrder.shipping_address} />
            <AddressBlock title="Billing Address" address={activeOrder.billing_address || activeOrder.shipping_address} />
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">Payment</h3>
            <p>Total: <span className="font-semibold text-white">{formatProductPrice(activeOrder.total_amount)}</span></p>
            <p className="mt-1">Method: {activeOrder.payment_method}</p>
            <p className="mt-1 capitalize">Status: {activeOrder.payment_status}</p>
            {activeOrder.tracking_number ? (
              <p className="mt-2 font-mono text-xs">Tracking: {activeOrder.tracking_number}</p>
            ) : null}
            {activeOrder.courier_name ? (
              <p className="mt-1">Courier: {activeOrder.courier_name}</p>
            ) : null}
          </section>

          {(invoice || label) ? (
            <section className="grid gap-2">
              {invoice ? <DocumentLink doc={invoice} /> : null}
              {label ? <DocumentLink doc={label} /> : null}
            </section>
          ) : null}
        </div>
      </aside>
    </>
  );
}
