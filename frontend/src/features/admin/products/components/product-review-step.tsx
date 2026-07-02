'use client';

import { useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CMS_VISIBILITY,
  formatAdminProductTypeLabel,
} from '../constants/cms-taxonomy';
import type { ProductFormValues } from '../schemas/product-form.schema';
import { resolveImagePreviewSrc, type UploadedImageItem } from './image-uploader';
import type { VariantRow } from './variant-selector';
import { AddProductVariantModal, type AddVariantSpec } from './add-product-variant-modal';
import { WizardFieldLabel } from './wizard-field-label';
import { wizardSelectClass } from './wizard-form-styles';
import { cn } from '@/utils/cn';

type ProductReviewStepProps = {
  values: ProductFormValues;
  images: UploadedImageItem[];
  variants: VariantRow[];
  onVisibilityChange: (value: ProductFormValues['visibility']) => void;
  register: ReturnType<typeof import('react-hook-form').useForm<ProductFormValues>>['register'];
  onCreateVariant?: (spec: AddVariantSpec) => Promise<void>;
  isCreatingVariant?: boolean;
};

function ReviewRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="text-sm font-semibold text-purple-200">{title}</h4>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function ProductReviewStep({
  values,
  images,
  variants,
  onVisibilityChange,
  register,
  onCreateVariant,
  isCreatingVariant,
}: ProductReviewStepProps) {
  const [variantModalOpen, setVariantModalOpen] = useState(false);

  const extraFields = [
    ['Fabric', values.fabric],
    ['Fit', values.fit],
    ['Pattern', values.pattern],
    ['Sleeve Type', values.sleeveType],
    ['Neck Type', values.neckType],
    ['Occasion', values.occasion],
    ['Season', values.season],
    ['Care Instructions', values.careInstructions],
    ['Country Of Origin', values.countryOfOrigin],
    ['Material', values.material],
    ['Weight (g)', values.weight],
    ['Tags', values.tags?.join(', ')],
    ['Keywords', values.searchKeywords?.join(', ')],
  ] as const;

  const flags = [
    values.isFeatured && 'Featured',
    values.isTrending && 'Trending',
    values.isNewArrival && 'New Arrival',
    values.isBestSeller && 'Best Seller',
    values.isLimitedEdition && 'Limited Edition',
  ].filter(Boolean);

  const totalStock = variants.length
    ? variants.reduce((sum, variant) => sum + (variant.stock ?? 0), 0)
    : values.stockQuantity;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
        <p className="text-sm text-slate-300">
          Review every detail below. Use <strong className="text-white">Save Draft</strong> to keep the product in admin only,
          or <strong className="text-white">Publish Product</strong> to make it live for customers.
        </p>
      </div>

      {images.length ? (
        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-purple-200">Product Images</h4>
          <div className="flex flex-wrap gap-3">
            {images.map((image, index) => (
              <div
                key={image.id || image.url || index}
                className="relative size-24 overflow-hidden rounded-xl border border-white/10 bg-[#111827]/60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveImagePreviewSrc(image)}
                  alt=""
                  className="size-full object-cover"
                />
                {image.isPrimary ? (
                  <span className="absolute bottom-1 left-1 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Primary
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <ReviewSection title="Basic Information">
        <ReviewRow label="SKU" value={values.sku} />
        <ReviewRow label="Product Name" value={values.name} />
        <ReviewRow label="Brand" value={values.brand} />
        <ReviewRow label="Category" value={values.category} />
        <ReviewRow label="Product Type" value={formatAdminProductTypeLabel(values.productType)} />
        <ReviewRow label="Gender" value={values.gender} />
        {values.description ? (
          <div className="sm:col-span-2">
            <ReviewRow label="Description" value={values.description} />
          </div>
        ) : null}
      </ReviewSection>

      <ReviewSection title="Pricing">
        <ReviewRow label="MRP" value={values.mrp != null ? `₹${values.mrp}` : undefined} />
        <ReviewRow label="Selling Price" value={values.sellingPrice != null ? `₹${values.sellingPrice}` : undefined} />
        {values.discountPercent != null ? (
          <ReviewRow label="Discount (auto)" value={`${values.discountPercent}%`} />
        ) : null}
      </ReviewSection>

      <ReviewSection title="Inventory">
        <ReviewRow label="Total Stock" value={totalStock} />
      </ReviewSection>

      {variants.length ? (
        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-purple-200">Variants</h4>
          <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Color</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">SKU</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, index) => (
                  <tr key={`${variant.color}-${variant.size}-${index}`} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-3 py-2 text-white">{variant.color}</td>
                    <td className="px-3 py-2 text-white">{variant.size}</td>
                    <td className="px-3 py-2 text-white">{variant.stock ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-400">{variant.sku || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <ReviewSection title="Extra Information">
        {extraFields.map(([label, value]) => (
          <ReviewRow key={label} label={label} value={value as string | number | undefined} />
        ))}
      </ReviewSection>

      {(values.aiAttributes?.style || values.aiAttributes?.bodyFit) ? (
        <ReviewSection title="AI Attributes">
          <ReviewRow label="Style" value={values.aiAttributes?.style} />
          <ReviewRow label="Body Fit" value={values.aiAttributes?.bodyFit} />
          <ReviewRow
            label="Body Types"
            value={values.aiAttributes?.recommendedBodyTypes?.join(', ')}
          />
          <ReviewRow
            label="Face Shapes"
            value={values.aiAttributes?.recommendedFaceShapes?.join(', ')}
          />
        </ReviewSection>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#111827]/40 p-4">
        <h4 className="text-sm font-semibold text-purple-200">Publish Settings</h4>

        <div>
          <WizardFieldLabel>Status</WizardFieldLabel>
          <select
            {...register('visibility')}
            onChange={(event) => onVisibilityChange(event.target.value as ProductFormValues['visibility'])}
            className={wizardSelectClass}
          >
            {CMS_VISIBILITY.map((status) => (
              <option key={status} value={status} className="bg-[#0d1224] text-white">{status}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['isFeatured', 'Featured Product'],
            ['isTrending', 'Trending'],
            ['isNewArrival', 'New Arrival'],
            ['isBestSeller', 'Best Seller'],
            ['isLimitedEdition', 'Limited Edition'],
          ].map(([field, label]) => (
            <label key={field} className="flex items-center gap-2.5 text-sm text-white">
              <input
                type="checkbox"
                {...register(field as keyof ProductFormValues)}
                className="size-4 rounded border-white/20 bg-[#111827]/60 text-primary focus:ring-purple-500/40"
              />
              {label}
            </label>
          ))}
        </div>

        {flags.length ? (
          <p className="text-xs text-slate-400">
            Badges: {flags.join(' · ')}
          </p>
        ) : null}

        <div className={cn(
          'rounded-xl border px-3 py-2.5 text-sm',
          values.visibility === 'PUBLISHED'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-200',
        )}>
          {values.visibility === 'PUBLISHED'
            ? 'Customers will see this product after publishing.'
            : 'Draft / hidden products stay in admin only until published.'}
        </div>
      </section>

      {onCreateVariant ? (
        <section className="rounded-2xl border border-dashed border-purple-500/30 bg-purple-500/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Linked Variant Products</h4>
              <p className="mt-1 text-sm text-slate-400">
                Create a separate draft product for another color or size that inherits these shared details.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setVariantModalOpen(true)}
              className="gap-2 border-purple-500/30 bg-transparent text-purple-100 hover:border-purple-400/50 hover:bg-purple-500/10"
            >
              <Plus className="size-4" />
              Add Variant
            </Button>
          </div>
        </section>
      ) : null}

      {onCreateVariant ? (
        <AddProductVariantModal
          open={variantModalOpen}
          onClose={() => setVariantModalOpen(false)}
          productType={values.productType}
          isSubmitting={isCreatingVariant}
          onSubmit={onCreateVariant}
        />
      ) : null}
    </div>
  );
}
