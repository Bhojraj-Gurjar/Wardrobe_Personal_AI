'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit, Minus, Plus, Star, X } from 'lucide-react';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { formatAdminProductTypeLabel } from '../constants/cms-taxonomy';

const PRODUCT_STATUS_OPTIONS = [
  { label: 'Active', value: 'PUBLISHED' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Archived', value: 'HIDDEN' },
] as const;

type ProductStatusValue = (typeof PRODUCT_STATUS_OPTIONS)[number]['value'];

function resolveStatusValue(product: Record<string, unknown> | null | undefined): ProductStatusValue {
  if (!product) return 'DRAFT';
  const visibility = String(product.visibility || '').toUpperCase();
  if (visibility === 'HIDDEN' || product.isActive === false) {
    return 'HIDDEN';
  }
  if (visibility === 'DRAFT') {
    return 'DRAFT';
  }
  return 'PUBLISHED';
}

type InventoryLogEntry = {
  id: string;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  changeType?: string;
  reason?: string | null;
  adminName?: string | null;
  createdAt?: string;
};

type ProductDetailDrawerProps = {
  product: Record<string, unknown> | null;
  isLoading?: boolean;
  error?: string | null;
  isSaving?: boolean;
  onClose: () => void;
  onEdit: (product: Record<string, unknown>) => void;
  onSaveChanges: (
    productId: string,
    payload: { price?: number; stock?: number; visibility?: ProductStatusValue },
  ) => Promise<void>;
};

function InlineNumericField({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  disabled = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  step?: number;
  disabled?: boolean;
  hint?: string;
}) {
  const numericValue = Number(value);
  const canDecrement = Number.isFinite(numericValue) && numericValue > min;

  const adjust = (delta: number) => {
    const current = Number(value);
    const base = Number.isFinite(current) ? current : min;
    onChange(String(Math.max(min, base + delta)));
  };

  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <div className="min-w-0">
        <span className="text-dashboard-muted">{label}</span>
        {hint ? <p className="mt-0.5 text-[11px] text-dashboard-muted/80">{hint}</p> : null}
      </div>
      <div
        className={cn(
          'flex items-center gap-1 rounded-xl border border-white/15 bg-dashboard-bg/80 p-1',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        )}
      >
        <button
          type="button"
          disabled={disabled || !canDecrement}
          onClick={() => adjust(-step)}
          className={cn(
            'flex size-8 items-center justify-center rounded-lg border border-transparent',
            'text-dashboard-muted transition-colors hover:border-white/10 hover:bg-white/[0.06] hover:text-dashboard-foreground',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <Minus className="size-3.5" />
        </button>
        <Input
          type="number"
          min={min}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'h-9 w-24 border-0 bg-transparent px-2 text-center text-sm font-semibold',
            'text-dashboard-foreground shadow-none focus-visible:ring-0',
          )}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => adjust(step)}
          className={cn(
            'flex size-8 items-center justify-center rounded-lg border border-transparent',
            'text-dashboard-muted transition-colors hover:border-white/10 hover:bg-white/[0.06] hover:text-dashboard-foreground',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-dashboard-muted">{label}</span>
      <span className="text-right font-medium text-dashboard-foreground">{value ?? '—'}</span>
    </div>
  );
}

function statusBadgeClass(status: string) {
  if (status === 'Published') return 'bg-emerald-500/15 text-emerald-400';
  if (status === 'Out of Stock') return 'bg-red-500/15 text-red-400';
  if (status === 'Draft') return 'bg-dashboard-border text-dashboard-muted';
  return 'bg-primary/15 text-primary';
}

function formatLogDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProductDetailDrawer({
  product,
  isLoading = false,
  error = null,
  isSaving = false,
  onClose,
  onEdit,
  onSaveChanges,
}: ProductDetailDrawerProps) {
  const [priceInput, setPriceInput] = useState('');
  const [stockInput, setStockInput] = useState('');
  const [statusInput, setStatusInput] = useState<ProductStatusValue>('DRAFT');

  useEffect(() => {
    if (error) {
      console.error('[ProductDetailDrawer] Failed to load product details:', error);
    }
  }, [error]);

  useEffect(() => {
    if (!product) {
      return;
    }

    setPriceInput(String(product.price ?? ''));
    setStockInput(String(product.stock ?? 0));
    setStatusInput(resolveStatusValue(product));
  }, [product]);

  const productId = product ? String(product.id || '') : '';
  const variants = (product?.variants || []) as Array<Record<string, unknown>>;
  const images = (product?.images || []) as Array<{ url?: string; isPrimary?: boolean }>;
  const analytics = {
    views: Number((product?.analytics as Record<string, unknown> | undefined)?.views ?? 0) || 0,
    wishlistCount: Number((product?.analytics as Record<string, unknown> | undefined)?.wishlistCount ?? 0) || 0,
    orders: Number((product?.analytics as Record<string, unknown> | undefined)?.orders ?? 0) || 0,
  };
  const inventoryHistory = Array.isArray(product?.inventoryHistory)
    ? (product.inventoryHistory as InventoryLogEntry[])
    : [];

  const imageUrl = product
    ? product.imageUrl || images.find((image) => image.isPrimary)?.url || images[0]?.url
    : null;

  const displayStatus = useMemo(() => {
    if (!product) return 'Draft';
    const currentStock = Number(stockInput);
    if (Number.isFinite(currentStock) && currentStock <= 0) {
      return 'Out of Stock';
    }
    if (String(product.status) === 'Out of Stock' && currentStock > 0) {
      return 'Published';
    }
    return String(product.status || 'Draft');
  }, [product, stockInput]);

  const hasUnsavedChanges = useMemo(() => {
    if (!product) return false;

    const baselinePrice = Number(product.price ?? 0);
    const nextPrice = Number(priceInput);
    const priceChanged = priceInput !== ''
      && Number.isFinite(nextPrice)
      && Math.round(nextPrice * 100) !== Math.round(baselinePrice * 100);

    const baselineStock = Number(product.stock ?? 0);
    const nextStock = Number(stockInput);
    const stockChanged = stockInput !== ''
      && Number.isFinite(nextStock)
      && nextStock !== baselineStock;

    const statusChanged = statusInput !== resolveStatusValue(product);

    return priceChanged || stockChanged || statusChanged;
  }, [priceInput, product, statusInput, stockInput]);

  const saveFieldChanges = async () => {
    if (!productId || !product || !hasUnsavedChanges) {
      return;
    }

    const payload: { price?: number; stock?: number; visibility?: ProductStatusValue } = {};
    const nextPrice = Number(priceInput);
    const nextStock = Number(stockInput);

    if (Number.isFinite(nextPrice) && nextPrice !== Number(product.price ?? 0)) {
      payload.price = nextPrice;
    }

    if (Number.isFinite(nextStock) && nextStock !== Number(product.stock ?? 0)) {
      payload.stock = Math.max(0, Math.round(nextStock));
    }

    if (statusInput !== resolveStatusValue(product)) {
      payload.visibility = statusInput;
    }

    await onSaveChanges(productId, payload);
    onClose();
  };

  if (!product && !isLoading && !error) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
        aria-label="Close product details"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden',
          'rounded-2xl border border-dashboard-border bg-dashboard-surface shadow-2xl',
        )}
      >
        <div className="flex items-start justify-between border-b border-dashboard-border px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
              Product Details
            </p>
            {isLoading ? (
              <Skeleton className="mt-2 h-7 w-56 rounded-lg bg-dashboard-bg" />
            ) : (
              <h2 className="mt-1 text-xl font-bold text-dashboard-foreground">
                {String(product?.name || 'Product')}
              </h2>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {isLoading ? (
                <Skeleton className="h-6 w-24 rounded-full bg-dashboard-bg" />
              ) : (
                <Badge className={statusBadgeClass(displayStatus)}>{displayStatus}</Badge>
              )}
              {!isLoading && product?.rating != null ? (
                <span className="inline-flex items-center gap-1 text-xs text-dashboard-muted">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  {String(product.rating)}
                </span>
              ) : null}
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {error && !isLoading ? (
            <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-bg/40">
            {isLoading ? (
              <Skeleton className="aspect-[4/3] w-full rounded-none bg-dashboard-bg" />
            ) : imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={String(imageUrl)} alt="" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-dashboard-muted">
                No image
              </div>
            )}
          </div>

          <div className="mt-5 space-y-1 border-b border-dashboard-border pb-4">
            {isLoading ? (
              Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} className="my-2 h-8 w-full rounded-lg bg-dashboard-bg" />
              ))
            ) : (
              <>
                <DetailRow label="Brand" value={product?.brand as string} />
                <DetailRow label="Category" value={product?.category as string} />
                <DetailRow label="Type" value={formatAdminProductTypeLabel(product?.productType as string)} />
                <DetailRow label="Gender" value={product?.gender as string} />

                <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <span className="text-dashboard-muted">Price</span>
                    <p className="mt-0.5 text-[11px] text-dashboard-muted/80">
                      Current
                      {' '}
                      {formatProductPrice(product?.price as number, product?.currency as string)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex min-w-[11rem] items-center rounded-xl border border-white/15 bg-dashboard-bg/80 px-3',
                      'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                    )}
                  >
                    <span className="shrink-0 pr-2 text-xs font-medium text-dashboard-muted">
                      {String(product?.currency || 'INR')}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceInput}
                      disabled={isSaving}
                      onChange={(event) => setPriceInput(event.target.value)}
                      className={cn(
                        'h-10 border-0 bg-transparent px-0 text-right text-sm font-semibold',
                        'text-dashboard-foreground shadow-none focus-visible:ring-0',
                      )}
                    />
                  </div>
                </div>

                <InlineNumericField
                  label="Stock"
                  value={stockInput}
                  onChange={setStockInput}
                  min={0}
                  step={1}
                  disabled={isSaving}
                />

                <DetailRow label="Variants" value={variants.length || Number(product?.variantCount ?? 0)} />

                <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <span className="text-dashboard-muted">Status</span>
                  <SelectField
                    value={statusInput}
                    disabled={isSaving}
                    onChange={(event) => setStatusInput(event.target.value as ProductStatusValue)}
                    className={cn(
                      'h-10 w-44 rounded-xl border-white/15 bg-dashboard-bg/80 px-3 text-sm font-medium',
                      'text-dashboard-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                    )}
                  >
                    {PRODUCT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectField>
                </div>
              </>
            )}
          </div>

          {!isLoading && product?.description ? (
            <div className="border-b border-dashboard-border py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                Description
              </p>
              <p className="text-sm leading-relaxed text-dashboard-foreground">
                {String(product.description)}
              </p>
            </div>
          ) : null}

          <div className="border-b border-dashboard-border py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
              Analytics
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Views', value: analytics.views },
                { label: 'Wishlist', value: analytics.wishlistCount },
                { label: 'Orders', value: analytics.orders },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-dashboard-border bg-dashboard-bg/40 px-3 py-2 text-center"
                >
                  {isLoading ? (
                    <Skeleton className="mx-auto mb-1 h-7 w-10 rounded bg-dashboard-bg" />
                  ) : (
                    <p className="text-lg font-bold text-dashboard-foreground">{item.value}</p>
                  )}
                  <p className="text-[11px] uppercase tracking-wide text-dashboard-muted">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {!isLoading && variants.length ? (
            <div className="border-b border-dashboard-border py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                Variants
              </p>
              <div className="space-y-2">
                {variants.map((variant) => (
                  <div
                    key={String(variant.id)}
                    className="flex items-center justify-between rounded-xl border border-dashboard-border px-3 py-2 text-sm"
                  >
                    <span className="text-dashboard-foreground">
                      {[variant.color, variant.size].filter(Boolean).join(' · ') || variant.sku}
                    </span>
                    <span className="text-dashboard-muted">Stock {String(variant.stock ?? 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
              Recent Stock Logs
            </p>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full rounded-lg bg-dashboard-bg" />
                ))}
              </div>
            ) : inventoryHistory.length ? (
              <div className="max-h-36 space-y-2 overflow-y-auto rounded-xl border border-dashboard-border bg-dashboard-bg/30 p-2">
                {inventoryHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-dashboard-foreground">
                        {entry.quantityChange > 0 ? '+' : ''}
                        {entry.quantityChange}
                        {' '}
                        units
                        {' '}
                        <span className="text-dashboard-muted">
                          ({entry.quantityBefore}
                          {' → '}
                          {entry.quantityAfter})
                        </span>
                      </p>
                      <p className="text-dashboard-muted">
                        {entry.adminName || 'System'}
                        {entry.reason ? ` · ${entry.reason}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-dashboard-muted">
                      {formatLogDate(entry.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dashboard-muted">No inventory changes recorded yet.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-dashboard-border px-6 py-4 sm:flex-row">
          {hasUnsavedChanges ? (
            <Button
              type="button"
              className="w-full rounded-xl sm:flex-1"
              disabled={isLoading || isSaving}
              onClick={saveFieldChanges}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          ) : null}
          <Button
            type="button"
            className="w-full gap-2 rounded-xl sm:flex-1"
            disabled={isLoading || isSaving}
            onClick={() => product && onEdit(product)}
          >
            <Edit className="size-4" />
            Edit Product
          </Button>
        </div>
      </div>
    </div>
  );
}
