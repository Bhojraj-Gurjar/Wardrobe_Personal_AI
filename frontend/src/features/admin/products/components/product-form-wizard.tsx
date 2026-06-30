'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { showToast } from '@/stores/toast-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import {
  CMS_AI_STYLES,
  CMS_BODY_FITS,
  CMS_BODY_TYPES,
  CMS_FACE_SHAPES,
  CMS_GENDERS,
  CMS_VISIBILITY,
  getProductTypesForCategory,
} from '../constants/cms-taxonomy';
import {
  defaultProductFormValues,
  productFormSchema,
  type ProductFormValues,
} from '../schemas/product-form.schema';
import { CategorySelector } from './category-selector';
import { ProductTypeSelector } from './product-type-selector';
import { ImageUploader, type UploadedImageItem } from './image-uploader';
import { VariantSelector, type VariantRow } from './variant-selector';
import {
  wizardInputClass,
  wizardLabelClass,
  wizardReadOnlyInputClass,
  wizardSelectClass,
  wizardTextareaClass,
} from './wizard-form-styles';

const STEPS = [
  'Basic Information',
  'Pricing',
  'Images',
  'Variants',
  'Extra Information',
  'AI & Visibility',
];

const FIELD_STEP_INDEX: Partial<Record<keyof ProductFormValues, number>> = {
  name: 0,
  brand: 0,
  category: 0,
  productType: 0,
  gender: 0,
  description: 0,
  mrp: 1,
  sellingPrice: 1,
  discountPercent: 1,
  taxPercent: 1,
  stockQuantity: 1,
  sku: 1,
  barcode: 1,
  images: 2,
  variants: 3,
  visibility: 5,
};

function resolveFirstValidationError(errors: Record<string, unknown>): string | null {
  for (const value of Object.values(errors)) {
    if (!value || typeof value !== 'object') continue;
    if ('message' in value && typeof value.message === 'string' && value.message) {
      return value.message;
    }
    const nested = resolveFirstValidationError(value as Record<string, unknown>);
    if (nested) return nested;
  }
  return null;
}

function resolveErrorStep(errors: Record<string, unknown>): number | null {
  for (const [field, value] of Object.entries(errors)) {
    if (!value) continue;
    const step = FIELD_STEP_INDEX[field as keyof ProductFormValues];
    if (step != null) return step;
    if (typeof value === 'object') {
      const nested = resolveErrorStep(value as Record<string, unknown>);
      if (nested != null) return nested;
    }
  }
  return null;
}

type ProductFormWizardProps = {
  onClose: () => void;
  onSubmit: (values: ProductFormValues, imageFiles: File[]) => Promise<void>;
  initialValues?: Partial<ProductFormValues>;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
};

export function ProductFormWizard({
  onClose,
  onSubmit,
  initialValues,
  isSubmitting,
  mode = 'create',
}: ProductFormWizardProps) {
  const [step, setStep] = useState(0);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { ...defaultProductFormValues, ...initialValues },
    mode: 'onChange',
  });

  const {
    register,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = form;

  const category = watch('category');
  const productType = watch('productType');
  const mrp = watch('mrp');
  const sellingPrice = watch('sellingPrice');
  const images = watch('images') as UploadedImageItem[];
  const variants = watch('variants') as VariantRow[];
  const previousCategoryRef = useRef(category);

  useEffect(() => {
    if (initialValues) {
      form.reset({ ...defaultProductFormValues, ...initialValues });
      previousCategoryRef.current = String(initialValues.category ?? defaultProductFormValues.category);
    }
  }, [form, initialValues]);

  useEffect(() => {
    if (previousCategoryRef.current === category) {
      return;
    }

    previousCategoryRef.current = category;
    const types = getProductTypesForCategory(category);

    if (!types.length) {
      return;
    }

    setValue('productType', types.includes(productType) ? productType : types[0], {
      shouldValidate: true,
    });
  }, [category, productType, setValue]);

  useEffect(() => {
    if (sellingPrice > 0 && mrp <= 0) {
      setValue('mrp', sellingPrice, { shouldValidate: true });
      return;
    }

    if (mrp > 0 && sellingPrice >= 0) {
      const discount = ((mrp - sellingPrice) / mrp) * 100;
      setValue('discountPercent', Math.max(0, Math.round(discount * 100) / 100));
    }
  }, [mrp, sellingPrice, setValue]);

  const stepFields: Record<number, (keyof ProductFormValues)[]> = useMemo(() => ({
    0: ['name', 'brand', 'category', 'productType', 'gender'],
    1: ['mrp', 'sellingPrice'],
    2: ['images'],
    3: [],
    4: [],
    5: ['visibility'],
  }), []);

  const goNext = async () => {
    const fields = stepFields[step];
    const valid = fields.length ? await trigger(fields) : true;
    if (!valid) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleSubmit = form.handleSubmit(
    async (values) => {
      const files = (values.images as UploadedImageItem[])
        .map((image) => image.file)
        .filter((file): file is File => Boolean(file));
      await onSubmit(values, files);
    },
    (validationErrors) => {
      const message = resolveFirstValidationError(validationErrors as Record<string, unknown>)
        || 'Please fix the highlighted fields before saving.';
      const errorStep = resolveErrorStep(validationErrors as Record<string, unknown>);
      if (errorStep != null) {
        setStep(errorStep);
      }
      showToast(message, 'error');
    },
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-wizard-title"
        className={cn(
          'flex max-h-[min(90vh,840px)] w-full max-w-3xl flex-col overflow-hidden',
          'rounded-2xl border border-white/10 bg-[#0d1224]/95 shadow-[0_28px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl',
        )}
      >
        <div className="shrink-0 border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 id="product-form-wizard-title" className="text-lg font-semibold text-white">
                {mode === 'edit' ? 'Edit Product' : 'Add Single Product'}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Step {step + 1} of {STEPS.length}: {STEPS[step]}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 p-2 text-slate-400 transition-colors hover:border-purple-500/40 hover:bg-white/5 hover:text-white"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-5 flex gap-1.5" aria-hidden="true">
            {STEPS.map((label, index) => (
              <div
                key={label}
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/10"
                title={label}
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300 ease-out',
                    index <= step
                      ? 'w-full bg-gradient-to-r from-primary via-purple-500 to-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.45)]'
                      : 'w-0 bg-transparent',
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {step === 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={wizardLabelClass}>Product Name</label>
                  <Input {...register('name')} className={wizardInputClass} />
                  {errors.name ? <p className="mt-1 text-xs text-destructive">{errors.name.message}</p> : null}
                </div>
                <div>
                  <label className={wizardLabelClass}>Brand</label>
                  <Input {...register('brand')} className={wizardInputClass} />
                  {errors.brand ? <p className="mt-1 text-xs text-destructive">{errors.brand.message}</p> : null}
                </div>
                <CategorySelector
                  value={category}
                  onChange={(value) => setValue('category', value)}
                  error={errors.category?.message}
                />
                <ProductTypeSelector
                  category={category}
                  value={productType}
                  onChange={(value) => setValue('productType', value)}
                  error={errors.productType?.message}
                />
                <div>
                  <label className={wizardLabelClass}>Gender</label>
                  <select {...register('gender')} className={wizardSelectClass}>
                    {CMS_GENDERS.map((gender) => (
                      <option key={gender} value={gender} className="bg-[#0d1224] text-white">{gender}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={wizardLabelClass}>Description</label>
                  <textarea
                    {...register('description')}
                    rows={5}
                    className={wizardTextareaClass}
                  />
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={wizardLabelClass}>MRP</label>
                  <Input type="number" step="0.01" {...register('mrp')} className={wizardInputClass} />
                  {errors.mrp ? <p className="mt-1 text-xs text-destructive">{errors.mrp.message}</p> : null}
                </div>
                <div>
                  <label className={wizardLabelClass}>Selling Price</label>
                  <Input type="number" step="0.01" {...register('sellingPrice')} className={wizardInputClass} />
                  {errors.sellingPrice ? <p className="mt-1 text-xs text-destructive">{errors.sellingPrice.message}</p> : null}
                </div>
                <div>
                  <label className={wizardLabelClass}>Discount %</label>
                  <Input type="number" {...register('discountPercent')} readOnly className={wizardReadOnlyInputClass} />
                </div>
                <div>
                  <label className={wizardLabelClass}>Tax %</label>
                  <Input type="number" {...register('taxPercent')} className={wizardInputClass} />
                </div>
                <div>
                  <label className={wizardLabelClass}>Stock Quantity</label>
                  <Input type="number" {...register('stockQuantity')} className={wizardInputClass} />
                </div>
                <div>
                  <label className={wizardLabelClass}>SKU</label>
                  <Input {...register('sku')} placeholder="Auto-generated if empty" className={wizardInputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={wizardLabelClass}>Barcode (optional)</label>
                  <Input {...register('barcode')} className={wizardInputClass} />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <ImageUploader
                value={images || []}
                onChange={(next) => setValue('images', next, { shouldValidate: true })}
                error={errors.images?.message as string | undefined}
              />
            ) : null}

            {step === 3 ? (
              <VariantSelector
                productType={productType}
                value={variants || []}
                baseSku={watch('sku')}
                onChange={(next) => setValue('variants', next)}
              />
            ) : null}

            {step === 4 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {['fabric', 'fit', 'pattern', 'sleeveType', 'neckType', 'occasion', 'season', 'careInstructions', 'countryOfOrigin', 'material'].map((field) => (
                  <div key={field}>
                    <label className={cn(wizardLabelClass, 'capitalize')}>{field.replace(/([A-Z])/g, ' $1')}</label>
                    <Input {...register(field as keyof ProductFormValues)} className={wizardInputClass} />
                  </div>
                ))}
                <div>
                  <label className={wizardLabelClass}>Weight (grams)</label>
                  <Input type="number" {...register('weight')} className={wizardInputClass} />
                </div>
                <div>
                  <label className={wizardLabelClass}>Tags (comma separated)</label>
                  <Input
                    onChange={(event) => setValue('tags', event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean))}
                    className={wizardInputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={wizardLabelClass}>Search Keywords (comma separated)</label>
                  <Input
                    onChange={(event) => setValue('searchKeywords', event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean))}
                    className={wizardInputClass}
                  />
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={wizardLabelClass}>Style</label>
                    <select
                      value={watch('aiAttributes.style') || ''}
                      onChange={(event) => setValue('aiAttributes.style', event.target.value)}
                      className={wizardSelectClass}
                    >
                      {CMS_AI_STYLES.map((style) => (
                        <option key={style} value={style} className="bg-[#0d1224] text-white">{style}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={wizardLabelClass}>Body Fit</label>
                    <select
                      value={watch('aiAttributes.bodyFit') || ''}
                      onChange={(event) => setValue('aiAttributes.bodyFit', event.target.value)}
                      className={wizardSelectClass}
                    >
                      {CMS_BODY_FITS.map((fit) => (
                        <option key={fit} value={fit} className="bg-[#0d1224] text-white">{fit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={wizardLabelClass}>Recommended Body Types</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CMS_BODY_TYPES.map((type) => {
                      const selected = watch('aiAttributes.recommendedBodyTypes')?.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            const current = watch('aiAttributes.recommendedBodyTypes') || [];
                            setValue(
                              'aiAttributes.recommendedBodyTypes',
                              selected ? current.filter((item) => item !== type) : [...current, type],
                            );
                          }}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs transition-colors',
                            selected
                              ? 'border-purple-500/70 bg-purple-500/15 text-purple-200 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                              : 'border-white/10 bg-[#111827]/40 text-slate-400 hover:border-purple-500/40 hover:text-white',
                          )}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={wizardLabelClass}>Recommended Face Shapes</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CMS_FACE_SHAPES.map((shape) => {
                      const selected = watch('aiAttributes.recommendedFaceShapes')?.includes(shape);
                      return (
                        <button
                          key={shape}
                          type="button"
                          onClick={() => {
                            const current = watch('aiAttributes.recommendedFaceShapes') || [];
                            setValue(
                              'aiAttributes.recommendedFaceShapes',
                              selected ? current.filter((item) => item !== shape) : [...current, shape],
                            );
                          }}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs transition-colors',
                            selected
                              ? 'border-purple-500/70 bg-purple-500/15 text-purple-200 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                              : 'border-white/10 bg-[#111827]/40 text-slate-400 hover:border-purple-500/40 hover:text-white',
                          )}
                        >
                          {shape}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={wizardLabelClass}>Visibility</label>
                  <select {...register('visibility')} className={wizardSelectClass}>
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
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-white/10 bg-[#0d1224]/80 px-6 py-4 backdrop-blur-md">
            <Button
              type="button"
              variant="ghost"
              onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
              className="gap-1 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <ChevronLeft className="size-4" />
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext} className="gap-1 rounded-xl bg-primary px-5 shadow-[0_8px_24px_rgba(139,92,246,0.35)] hover:bg-primary/90">
                Next
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="gap-2 rounded-xl bg-primary px-5 shadow-[0_8px_24px_rgba(139,92,246,0.35)]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : mode === 'edit' ? 'Save Product' : 'Publish Product'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
