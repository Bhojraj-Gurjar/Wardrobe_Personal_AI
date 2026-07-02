'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  getProductTypesForCategory,
} from '../constants/cms-taxonomy';
import {
  computeDiscountPercent,
  defaultProductFormValues,
  productFormSchema,
  STEP_ONE_REQUIRED_FIELDS,
  type ProductFormValues,
} from '../schemas/product-form.schema';
import { CategorySelector } from './category-selector';
import { ProductTypeSelector } from './product-type-selector';
import { ImageUploader, revokeAllImagePreviews, type UploadedImageItem } from './image-uploader';
import { VariantSelector, type VariantRow } from './variant-selector';
import { ProductReviewStep } from './product-review-step';
import { WizardFieldLabel } from './wizard-field-label';
import type { AddVariantSpec } from './add-product-variant-modal';
import {
  wizardInputClass,
  wizardSelectClass,
  wizardTextareaClass,
} from './wizard-form-styles';

const STEPS = [
  'Basic Information',
  'Images',
  'Pricing',
  'Inventory',
  'Extra Information',
  'Review & Publish',
] as const;

const REVIEW_STEP = STEPS.length - 1;

const FIELD_STEP_INDEX: Partial<Record<keyof ProductFormValues, number>> = {
  sku: 0,
  name: 0,
  brand: 0,
  category: 0,
  productType: 0,
  gender: 0,
  description: 0,
  images: 1,
  mrp: 2,
  sellingPrice: 2,
  variants: 3,
  visibility: REVIEW_STEP,
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

function emptyToUndefined(value: unknown) {
  return value === '' || value === null ? undefined : value;
}

function parseFormNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

type ProductFormWizardProps = {
  onClose: () => void;
  onSubmit: (
    values: ProductFormValues,
    imageFiles: File[],
    options?: { wizardStep?: number },
  ) => Promise<void>;
  onCreateVariantProduct?: (
    values: ProductFormValues,
    imageFiles: File[],
    spec: AddVariantSpec,
  ) => Promise<void>;
  initialValues?: Partial<ProductFormValues>;
  initialStep?: number;
  isSubmitting?: boolean;
  isCreatingVariant?: boolean;
  mode?: 'create' | 'edit';
};

export function ProductFormWizard({
  onClose,
  onSubmit,
  onCreateVariantProduct,
  initialValues,
  initialStep = 0,
  isSubmitting,
  isCreatingVariant,
  mode = 'create',
}: ProductFormWizardProps) {
  const [step, setStep] = useState(initialStep);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    getValues,
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
      previousCategoryRef.current = String(initialValues.category ?? '');
    }
  }, [form, initialValues]);

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    if (previousCategoryRef.current === category) {
      return;
    }

    previousCategoryRef.current = category;
    if (!productType) {
      return;
    }

    const types = getProductTypesForCategory(category);
    if (!types.includes(productType)) {
      setValue('productType', '', { shouldValidate: true });
    }
  }, [category, productType, setValue]);

  useEffect(() => {
    const discount = computeDiscountPercent(mrp, sellingPrice);
    setValue('discountPercent', discount, { shouldValidate: false });
  }, [mrp, sellingPrice, setValue]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  useEffect(() => () => {
    revokeAllImagePreviews(getValues('images') as UploadedImageItem[]);
  }, [getValues]);

  const handleClose = useCallback(() => {
    revokeAllImagePreviews(getValues('images') as UploadedImageItem[]);
    onClose();
  }, [getValues, onClose]);

  const handleValidationFailure = useCallback((validationErrors: Record<string, unknown>) => {
    const message = resolveFirstValidationError(validationErrors)
      || 'Please fix the highlighted fields before saving.';
    const errorStep = resolveErrorStep(validationErrors);
    if (errorStep != null) {
      setStep(errorStep);
    }
    showToast(message, 'error');
  }, []);

  const submitValues = useCallback(async (
    values: ProductFormValues,
    options?: { wizardStep?: number },
  ) => {
    const files = (values.images as UploadedImageItem[])
      .map((image) => image.file)
      .filter((file): file is File => Boolean(file));
    await onSubmit(values, files, options);
  }, [onSubmit]);

  const submitProduct = form.handleSubmit(
    (values) => submitValues(values, { wizardStep: step }),
    handleValidationFailure,
  );

  const validateInventoryStep = useCallback(() => {
    const currentVariants = getValues('variants') || [];
    if (!currentVariants.length) {
      setInventoryError('Select a color and size, then enter stock.');
      showToast('Select a color and size, then enter stock.', 'error');
      return false;
    }

    const missingStock = currentVariants.some((variant) => variant.stock == null);
    if (missingStock) {
      setInventoryError('Stock is required for each selected size.');
      showToast('Stock is required for each selected size.', 'error');
      return false;
    }

    setInventoryError(null);
    return true;
  }, [getValues]);

  const goNext = async () => {
    if (step >= REVIEW_STEP) {
      return;
    }

    if (step === 0) {
      const valid = await trigger([...STEP_ONE_REQUIRED_FIELDS]);
      if (!valid) {
        return;
      }
    }

    if (step === 2) {
      const currentMrp = getValues('mrp');
      const currentSelling = getValues('sellingPrice');
      if (currentMrp != null || currentSelling != null) {
        const valid = await trigger(['mrp', 'sellingPrice']);
        if (!valid) {
          return;
        }
      }
    }

    if (step === 3 && !validateInventoryStep()) {
      return;
    }

    setStep((current) => Math.min(current + 1, REVIEW_STEP));
  };

  const handlePublish = async () => {
    setValue('visibility', 'PUBLISHED', { shouldValidate: true });
    await submitProduct();
  };

  const handleSaveDraft = async () => {
    setValue('visibility', 'DRAFT', { shouldValidate: false });
    const valid = await trigger([...STEP_ONE_REQUIRED_FIELDS]);
    if (!valid) {
      handleValidationFailure(errors as Record<string, unknown>);
      return;
    }
    await submitValues(getValues(), { wizardStep: step });
  };

  const handleEditSave = async () => {
    await submitProduct();
  };

  const handleCreateVariant = async (spec: AddVariantSpec) => {
    if (!onCreateVariantProduct) {
      return;
    }

    const valid = await trigger([...STEP_ONE_REQUIRED_FIELDS]);
    if (!valid) {
      handleValidationFailure(errors as Record<string, unknown>);
      throw new Error('Complete Step 1 required fields before adding a variant product.');
    }

    const values = getValues();
    const files = (values.images as UploadedImageItem[])
      .map((image) => image.file)
      .filter((file): file is File => Boolean(file));

    await onCreateVariantProduct(values, files, spec);
  };

  const preventAccidentalSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  };

  const numericField = (name: 'mrp' | 'sellingPrice' | 'weight') => register(name, {
    setValueAs: parseFormNumber,
  });

  const renderFooterActions = () => {
    if (step < REVIEW_STEP) {
      return (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={handleSaveDraft}
            className="border-white/10 bg-transparent text-slate-300 hover:border-purple-500/30 hover:bg-white/5 hover:text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : 'Save Draft'}
          </Button>
          <Button
            type="button"
            onClick={goNext}
            className="gap-1 rounded-xl bg-primary px-5 shadow-[0_8px_24px_rgba(139,92,246,0.35)] hover:bg-primary/90"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      );
    }

    if (mode === 'edit') {
      return (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={handleSaveDraft}
            className="border-white/10 bg-transparent text-slate-300 hover:border-purple-500/30 hover:bg-white/5 hover:text-white"
          >
            Save Draft
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleEditSave}
            className="gap-2 rounded-xl bg-primary px-5 shadow-[0_8px_24px_rgba(139,92,246,0.35)]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : 'Save Product'}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={handleSaveDraft}
          className="border-white/10 bg-transparent text-slate-300 hover:border-purple-500/30 hover:bg-white/5 hover:text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : 'Save Draft'}
        </Button>
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={handlePublish}
          className="gap-2 rounded-xl bg-primary px-5 shadow-[0_8px_24px_rgba(139,92,246,0.35)]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Publishing…
            </>
          ) : 'Publish Product'}
        </Button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-wizard-title"
        className={cn(
          'flex max-h-[min(92dvh,840px)] w-full max-w-3xl flex-col overflow-hidden',
          'rounded-t-2xl border border-white/10 bg-[#0d1224]/95 shadow-[0_28px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl',
          'sm:rounded-2xl',
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
              onClick={handleClose}
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

        <form onSubmit={preventAccidentalSubmit} className="flex min-h-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {step === 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <WizardFieldLabel required>SKU ID</WizardFieldLabel>
                  <Input
                    {...register('sku')}
                    placeholder="e.g. PRD-BLKTEE-001"
                    className={wizardInputClass}
                  />
                  {errors.sku ? <p className="mt-1 text-xs text-destructive">{errors.sku.message}</p> : null}
                </div>
                <div className="sm:col-span-2">
                  <WizardFieldLabel required>Product Name</WizardFieldLabel>
                  <Input {...register('name')} placeholder="Enter product name" className={wizardInputClass} />
                  {errors.name ? <p className="mt-1 text-xs text-destructive">{errors.name.message}</p> : null}
                </div>
                <div>
                  <WizardFieldLabel required>Brand</WizardFieldLabel>
                  <Input {...register('brand')} placeholder="Enter brand" className={wizardInputClass} />
                  {errors.brand ? <p className="mt-1 text-xs text-destructive">{errors.brand.message}</p> : null}
                </div>
                <CategorySelector
                  required
                  value={category}
                  onChange={(value) => setValue('category', value, { shouldValidate: true })}
                  error={errors.category?.message}
                />
                <ProductTypeSelector
                  required
                  category={category}
                  value={productType}
                  onChange={(value) => setValue('productType', value, { shouldValidate: true })}
                  error={errors.productType?.message}
                />
                <div>
                  <WizardFieldLabel required>Gender</WizardFieldLabel>
                  <select {...register('gender')} className={wizardSelectClass}>
                    <option value="" className="bg-[#0d1224] text-white/60">Select gender</option>
                    {CMS_GENDERS.map((gender) => (
                      <option key={gender} value={gender} className="bg-[#0d1224] text-white">{gender}</option>
                    ))}
                  </select>
                  {errors.gender ? <p className="mt-1 text-xs text-destructive">{errors.gender.message}</p> : null}
                </div>
                <div className="sm:col-span-2">
                  <WizardFieldLabel>Description</WizardFieldLabel>
                  <textarea
                    {...register('description')}
                    rows={5}
                    placeholder="Optional product description"
                    className={wizardTextareaClass}
                  />
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <ImageUploader
                value={images || []}
                onChange={(next) => setValue('images', next, { shouldValidate: true })}
                error={errors.images?.message as string | undefined}
              />
            ) : null}

            {step === 2 ? (
              <div className="grid max-w-xl gap-5 sm:grid-cols-2">
                <div>
                  <WizardFieldLabel required>MRP</WizardFieldLabel>
                  <Input type="number" step="0.01" placeholder="0" {...numericField('mrp')} className={wizardInputClass} />
                  {errors.mrp ? <p className="mt-1 text-xs text-destructive">{errors.mrp.message}</p> : null}
                </div>
                <div>
                  <WizardFieldLabel required>Selling Price</WizardFieldLabel>
                  <Input type="number" step="0.01" placeholder="0" {...numericField('sellingPrice')} className={wizardInputClass} />
                  {errors.sellingPrice ? <p className="mt-1 text-xs text-destructive">{errors.sellingPrice.message}</p> : null}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <VariantSelector
                productType={productType}
                value={variants || []}
                baseSku={watch('sku')}
                stockError={inventoryError || undefined}
                onChange={(next) => {
                  setInventoryError(null);
                  setValue('variants', next, { shouldValidate: true });
                }}
              />
            ) : null}

            {step === 4 ? (
              <div className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  {['fabric', 'fit', 'pattern', 'sleeveType', 'neckType', 'occasion', 'season', 'careInstructions', 'countryOfOrigin', 'material'].map((field) => (
                    <div key={field}>
                      <WizardFieldLabel className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</WizardFieldLabel>
                      <Input {...register(field as keyof ProductFormValues)} className={wizardInputClass} />
                    </div>
                  ))}
                  <div>
                    <WizardFieldLabel>Weight (grams)</WizardFieldLabel>
                    <Input type="number" placeholder="0" {...numericField('weight')} className={wizardInputClass} />
                  </div>
                  <div>
                    <WizardFieldLabel>Tags (comma separated)</WizardFieldLabel>
                    <Input
                      onChange={(event) => setValue('tags', event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean))}
                      placeholder="casual, cotton"
                      className={wizardInputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <WizardFieldLabel>Search Keywords (comma separated)</WizardFieldLabel>
                    <Input
                      onChange={(event) => setValue('searchKeywords', event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean))}
                      placeholder="summer, breathable"
                      className={wizardInputClass}
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <WizardFieldLabel>Style</WizardFieldLabel>
                    <select
                      value={watch('aiAttributes.style') || ''}
                      onChange={(event) => setValue('aiAttributes.style', event.target.value)}
                      className={wizardSelectClass}
                    >
                      <option value="" className="bg-[#0d1224] text-white/60">Select style</option>
                      {CMS_AI_STYLES.map((style) => (
                        <option key={style} value={style} className="bg-[#0d1224] text-white">{style}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <WizardFieldLabel>Body Fit</WizardFieldLabel>
                    <select
                      value={watch('aiAttributes.bodyFit') || ''}
                      onChange={(event) => setValue('aiAttributes.bodyFit', event.target.value)}
                      className={wizardSelectClass}
                    >
                      <option value="" className="bg-[#0d1224] text-white/60">Select body fit</option>
                      {CMS_BODY_FITS.map((fit) => (
                        <option key={fit} value={fit} className="bg-[#0d1224] text-white">{fit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <WizardFieldLabel>Recommended Body Types</WizardFieldLabel>
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
                  <WizardFieldLabel>Recommended Face Shapes</WizardFieldLabel>
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
              </div>
            ) : null}

            {step === REVIEW_STEP ? (
              <ProductReviewStep
                values={getValues()}
                images={images || []}
                variants={variants || []}
                register={register}
                onVisibilityChange={(value) => setValue('visibility', value, { shouldValidate: true })}
                onCreateVariant={mode === 'create' ? handleCreateVariant : undefined}
                isCreatingVariant={isCreatingVariant}
              />
            ) : null}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 bg-[#0d1224]/80 px-6 py-4 backdrop-blur-md">
            <Button
              type="button"
              variant="ghost"
              onClick={() => (step === 0 ? handleClose() : setStep((s) => s - 1))}
              className="gap-1 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <ChevronLeft className="size-4" />
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>

            {renderFooterActions()}
          </div>
        </form>
      </div>
    </div>
  );
}
