'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Star,
} from 'lucide-react';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { AdminPageHeader } from '@/features/admin/components/admin-metric-card';
import {
  useAdminProductsQuery,
  useAdminProductDetailQuery,
  useAdminDraftProductsQuery,
  useAdminCreateCmsProductMutation,
  useAdminUpdateProductMutation,
  useAdminUploadProductImagesMutation,
  useAdminDeleteProductMutation,
  useAdminToggleProductMutation,
  useAdminAdjustInventoryMutation,
  useAdminValidateBulkProductsMutation,
  useAdminImportBulkProductsMutation,
  useAdminToken,
} from '@/features/admin/hooks';
import { fetchAdminProductById } from '@/features/admin/services/admin.service';
import { AddProductChoiceModal } from '@/features/admin/products/components/add-product-choice-modal';
import { BulkUploadPanel } from '@/features/admin/products/components/bulk-upload-panel';
import { ProductDetailDrawer } from '@/features/admin/products/components/product-detail-drawer';
import { ProductFormWizard } from '@/features/admin/products/components/product-form-wizard';
import { ProductDraftsPanel } from '@/features/admin/products/components/product-drafts-panel';
import { productFormSchema } from '@/features/admin/products/schemas/product-form.schema';
import { CMS_CATEGORIES, formatAdminProductTypeLabel } from '@/features/admin/products/constants/cms-taxonomy';
import {
  buildProductMutationPayload,
  mapProductDetailToFormValues,
} from '@/features/admin/products/utils/product-form.mapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import { resolveProductImageUrl } from '@/utils/product-image';
import { showToast } from '@/stores/toast-store';
import {
  ResponsiveDataTable,
  ResponsiveTableCard,
  ResponsiveTableRow,
} from '@/components/shared/responsive-data-table';

function ProductStatusBadge({ status }) {
  return (
    <Badge className={cn(
      status === 'Published' && 'bg-emerald-500/15 text-emerald-400',
      status === 'Draft' && 'bg-dashboard-border text-dashboard-muted',
      status === 'Out of Stock' && 'bg-red-500/15 text-red-400',
      status === 'Hidden' && 'bg-dashboard-border text-dashboard-muted',
    )}>
      {status}
    </Badge>
  );
}

function AdminProductMobileCard({ product, onSelect, onEdit, onToggle, onDelete }) {
  return (
    <ResponsiveTableCard onClick={() => onSelect(product.id)}>
      <div className="flex items-start gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-dashboard-surface-elevated">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveProductImageUrl(product.imageUrl)} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-sm text-dashboard-muted">{product.name?.[0]}</span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-dashboard-foreground">{product.name}</p>
              <p className="truncate text-xs text-primary">{product.brand}</p>
            </div>
            <div onClick={(event) => event.stopPropagation()} role="presentation">
              <ProductActionsMenu
                product={product}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ProductStatusBadge status={product.status} />
            <span className="text-sm font-semibold text-dashboard-foreground">
              {formatProductPrice(product.price, product.currency)}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-0.5 border-t border-dashboard-border/60 pt-3">
        <ResponsiveTableRow label="Category">{product.category || '—'}</ResponsiveTableRow>
        <ResponsiveTableRow label="Type">{formatAdminProductTypeLabel(product.productType)}</ResponsiveTableRow>
        <ResponsiveTableRow label="Stock">
          <span className={cn((product.stock ?? 0) <= 10 && 'text-amber-400')}>{product.stock ?? 0}</span>
        </ResponsiveTableRow>
        <ResponsiveTableRow label="Variants">{product.variantCount ?? 0}</ResponsiveTableRow>
        <ResponsiveTableRow label="Created">
          {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '—'}
        </ResponsiveTableRow>
      </div>
    </ResponsiveTableCard>
  );
}

function resolveProductStatusValue(product) {
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

function ProductActionsMenu({ product, onEdit, onToggle, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <Button variant="ghost" size="icon" onClick={() => setOpen((prev) => !prev)} aria-label="Product actions">
        <MoreHorizontal className="size-4" />
      </Button>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-dashboard-border bg-dashboard-surface py-1 shadow-lg">
            <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-dashboard-surface-elevated" onClick={() => { onEdit(product); setOpen(false); }}>Edit</button>
            <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-dashboard-surface-elevated" onClick={() => { onToggle(product); setOpen(false); }}>
              {product.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button type="button" className="block w-full px-3 py-2 text-left text-sm text-destructive hover:bg-dashboard-surface-elevated" onClick={() => { onDelete(product); setOpen(false); }}>Delete</button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function AdminProductsView() {
  const queryClient = useQueryClient();
  const token = useAdminToken();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [choiceOpen, setChoiceOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [wizardInitialStep, setWizardInitialStep] = useState(0);
  const [publishingDraftId, setPublishingDraftId] = useState(null);
  const [deletingDraftId, setDeletingDraftId] = useState(null);

  const params = useMemo(() => ({
    search: search || undefined,
    category: category || undefined,
    status: status || undefined,
    stock: stockFilter || undefined,
    page,
    limit: 20,
    sortBy,
    sortOrder,
  }), [search, category, status, stockFilter, page, sortBy, sortOrder]);

  const { data, isLoading, isError, refetch } = useAdminProductsQuery(params);
  const { data: draftCountData } = useAdminDraftProductsQuery({
    page: 1,
    limit: 1,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  const draftCount = draftCountData?.meta?.total ?? 0;
  const { data: selectedDetail, isLoading: selectedDetailLoading, isError: selectedDetailError, error: selectedDetailFetchError } = useAdminProductDetailQuery(selectedProductId);
  const {
    data: editingDetail,
    isLoading: editingDetailLoading,
    isError: editingDetailError,
    error: editingDetailFetchError,
  } = useAdminProductDetailQuery(wizardOpen && editingProduct?.id ? editingProduct.id : null);

  useEffect(() => {
    if (!wizardOpen) {
      return;
    }

    if (editingProduct?.id && editingDetail?.draftWizardStep != null) {
      setWizardInitialStep(Number(editingDetail.draftWizardStep) || 0);
      return;
    }

    if (!editingProduct?.id) {
      setWizardInitialStep(0);
    }
  }, [wizardOpen, editingProduct?.id, editingDetail?.draftWizardStep]);

  const createCmsMutation = useAdminCreateCmsProductMutation();
  const updateMutation = useAdminUpdateProductMutation();
  const uploadImagesMutation = useAdminUploadProductImagesMutation();
  const deleteMutation = useAdminDeleteProductMutation();
  const toggleMutation = useAdminToggleProductMutation();
  const adjustInventoryMutation = useAdminAdjustInventoryMutation();
  const validateBulkMutation = useAdminValidateBulkProductsMutation();
  const importBulkMutation = useAdminImportBulkProductsMutation();

  const handleSaveProductFields = async (productId, { price, stock, visibility }) => {
    const current = selectedDetail;
    const updatePayload = {};

    if (price != null && Number(price) !== Number(current?.price ?? 0)) {
      updatePayload.price = price;
    }

    if (visibility != null && visibility !== resolveProductStatusValue(current)) {
      updatePayload.visibility = visibility;
    }

    if (Object.keys(updatePayload).length) {
      await updateMutation.mutateAsync({ id: productId, payload: updatePayload });
    }

    if (stock != null && stock !== Number(current?.stock ?? 0)) {
      const delta = stock - Number(current?.stock ?? 0);
      if (delta !== 0) {
        await adjustInventoryMutation.mutateAsync({
          productId,
          payload: {
            quantity: delta,
            reason: 'Admin stock update from product detail',
          },
        });
      }
    }
  };

  const handleSaveProduct = async (values, imageFiles, options) => {
    const payload = buildProductMutationPayload(
      values,
      values.visibility === 'DRAFT' ? { draftWizardStep: options?.wizardStep ?? 0 } : undefined,
    );

    try {
      if (editingProduct?.id) {
        await updateMutation.mutateAsync({ id: editingProduct.id, payload });

        if (imageFiles.length) {
          const uploaded = await uploadImagesMutation.mutateAsync({
            productId: editingProduct.id,
            files: imageFiles,
          });
          const mergedImages = [
            ...(payload.images || []),
            ...uploaded.images.map((image, index) => ({
              url: image.url,
              sortOrder: (payload.images?.length ?? 0) + index,
              isPrimary: (payload.images?.length ?? 0) === 0 && index === 0,
            })),
          ];
          await updateMutation.mutateAsync({
            id: editingProduct.id,
            payload: { images: mergedImages },
          });
        }

        showToast(
          values.visibility === 'PUBLISHED'
            ? 'Product published successfully.'
            : 'Draft updated successfully.',
        );
        setWizardOpen(false);
        setEditingProduct(null);
        setWizardInitialStep(0);
        await queryClient.invalidateQueries({ queryKey: ['admin-products'], refetchType: 'active' });
        await queryClient.invalidateQueries({ queryKey: ['admin-product-drafts'], refetchType: 'active' });
        await refetch();
        return;
      }

      const created = await createCmsMutation.mutateAsync(payload);
      const productId = created?.id;

      if (!productId) {
        throw new Error('Product was created but no product id was returned.');
      }

      if (imageFiles.length) {
        const uploaded = await uploadImagesMutation.mutateAsync({
          productId,
          files: imageFiles,
        });
        await updateMutation.mutateAsync({
          id: productId,
          payload: {
            images: uploaded.images.map((image, index) => ({
              url: image.url,
              sortOrder: index,
              isPrimary: index === 0,
            })),
          },
        });
      }

      showToast(
        values.visibility === 'PUBLISHED'
          ? 'Product published successfully.'
          : 'Product saved as draft.',
      );
      setWizardOpen(false);
      setEditingProduct(null);
      setWizardInitialStep(0);
      setPage(1);
      await queryClient.invalidateQueries({ queryKey: ['admin-products'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['admin-product-drafts'], refetchType: 'active' });
      await refetch();
    } catch (error) {
      showToast(error?.message || 'Unable to save product. Please try again.', 'error');
    }
  };

  const handleContinueDraft = (draft) => {
    setDraftsOpen(false);
    setEditingProduct(draft);
    setWizardInitialStep(Number(draft.draftWizardStep) || 0);
    setWizardOpen(true);
  };

  const handlePreviewDraft = (draft) => {
    setSelectedProductId(draft.id);
  };

  const handlePublishDraft = async (draft) => {
    if (!token) return;

    setPublishingDraftId(draft.id);
    try {
      const detail = await fetchAdminProductById(draft.id, token);
      const formValues = mapProductDetailToFormValues(detail);
      const parsed = productFormSchema.safeParse(formValues);

      if (!parsed.success) {
        showToast('Complete all required fields before publishing.', 'error');
        setDraftsOpen(false);
        setEditingProduct(draft);
        setWizardInitialStep(Number(detail.draftWizardStep) || 0);
        setWizardOpen(true);
        return;
      }

      const payload = buildProductMutationPayload({
        ...parsed.data,
        visibility: 'PUBLISHED',
      });

      await updateMutation.mutateAsync({ id: draft.id, payload });
      showToast('Product published successfully.');
      setPage(1);
      await queryClient.invalidateQueries({ queryKey: ['admin-products'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['admin-product-drafts'], refetchType: 'active' });
      await refetch();
    } catch (error) {
      showToast(error?.message || 'Unable to publish draft.', 'error');
    } finally {
      setPublishingDraftId(null);
    }
  };

  const handleDeleteDraft = async (draft) => {
    if (!window.confirm(`Delete draft "${draft.name}" permanently? This cannot be undone.`)) {
      return;
    }

    setDeletingDraftId(draft.id);
    try {
      await deleteMutation.mutateAsync(draft.id);
      showToast('Draft deleted.');
      if (selectedProductId === draft.id) setSelectedProductId(null);
      if (editingProduct?.id === draft.id) {
        setEditingProduct(null);
        setWizardOpen(false);
      }
      await queryClient.invalidateQueries({ queryKey: ['admin-product-drafts'], refetchType: 'active' });
    } catch (error) {
      showToast(error?.message || 'Unable to delete draft.', 'error');
    } finally {
      setDeletingDraftId(null);
    }
  };

  if (isLoading) {
    return <LoadingState title="Loading products…" rows={6} />;
  }

  if (isError) {
    return <ErrorState title="Unable to load products" onRetry={refetch} />;
  }

  const products = data?.items || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        label="Admin"
        title="Product Management"
        action={(
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="glass"
              className="relative gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-100 hover:border-purple-400/40 hover:bg-purple-500/15"
              onClick={() => setDraftsOpen(true)}
            >
              <FileText className="size-4" />
              Drafts
              {draftCount > 0 ? (
                <span className="ml-0.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-purple-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(139,92,246,0.45)]">
                  {draftCount > 99 ? '99+' : draftCount}
                </span>
              ) : null}
            </Button>
            <Button className="gap-2 rounded-xl" onClick={() => setChoiceOpen(true)}>
              <Plus className="size-4" />
              Add Product
            </Button>
          </div>
        )}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dashboard-muted" />
          <Input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search products..."
            className="h-11 border-dashboard-border bg-dashboard-surface pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2 [&_select]:min-h-10 [&_select]:flex-1 [&_select]:min-w-[calc(50%-0.25rem)] sm:[&_select]:min-w-0 sm:[&_select]:flex-none">
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-dashboard-border bg-dashboard-surface px-3 text-sm">
            <option value="">All categories</option>
            {CMS_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-dashboard-border bg-dashboard-surface px-3 text-sm">
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-dashboard-border bg-dashboard-surface px-3 text-sm">
            <option value="">All stock</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-10 rounded-lg border border-dashboard-border bg-dashboard-surface px-3 text-sm">
            <option value="createdAt">Created date</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="stock">Stock</option>
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="h-10 rounded-lg border border-dashboard-border bg-dashboard-surface px-3 text-sm">
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      <ResponsiveDataTable
        items={products}
        renderMobileCard={(product) => (
          <AdminProductMobileCard
            product={product}
            onSelect={setSelectedProductId}
            onEdit={(item) => { setEditingProduct(item); setWizardOpen(true); }}
            onToggle={(item) => toggleMutation.mutate(item.id)}
            onDelete={async (item) => {
              if (!window.confirm(`Delete ${item.name}?`)) return;
              try {
                await deleteMutation.mutateAsync(item.id);
              } catch (error) {
                window.alert(error?.message || 'Unable to delete this product.');
                return;
              }
              if (selectedProductId === item.id) setSelectedProductId(null);
              if (editingProduct?.id === item.id) {
                setEditingProduct(null);
                setWizardOpen(false);
              }
            }}
          />
        )}
      >
        <div className="overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-dashboard-border text-left text-xs uppercase tracking-wider text-dashboard-muted">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Variants</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="cursor-pointer border-b border-dashboard-border/60 transition-colors last:border-0 hover:bg-dashboard-bg/40"
                  onClick={() => setSelectedProductId(product.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-dashboard-surface-elevated">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resolveProductImageUrl(product.imageUrl)} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="text-xs text-dashboard-muted">{product.name?.[0]}</span>
                        )}
                      </span>
                      <div>
                        <p className="font-medium text-dashboard-foreground">{product.name}</p>
                        <p className="text-xs text-primary">{product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-dashboard-muted">{product.category}</td>
                  <td className="px-4 py-3 text-dashboard-muted">
                    {formatAdminProductTypeLabel(product.productType)}
                  </td>
                  <td className="px-4 py-3 text-dashboard-muted">{product.gender || '—'}</td>
                  <td className="px-4 py-3 text-dashboard-foreground">
                    {formatProductPrice(product.price, product.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn((product.stock ?? 0) <= 10 && 'text-amber-400')}>{product.stock ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-dashboard-muted">{product.variantCount ?? 0}</td>
                  <td className="px-4 py-3">
                    {product.rating != null ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        {product.rating}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <ProductStatusBadge status={product.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-dashboard-muted">
                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <ProductActionsMenu
                      product={product}
                      onEdit={(item) => { setEditingProduct(item); setWizardOpen(true); }}
                      onToggle={(item) => toggleMutation.mutate(item.id)}
                      onDelete={async (item) => {
                        if (!window.confirm(`Delete ${item.name}?`)) {
                          return;
                        }

                        try {
                          await deleteMutation.mutateAsync(item.id);
                        } catch (error) {
                          window.alert(error?.message || 'Unable to delete this product.');
                          return;
                        }

                        if (selectedProductId === item.id) {
                          setSelectedProductId(null);
                        }

                        if (editingProduct?.id === item.id) {
                          setEditingProduct(null);
                          setWizardOpen(false);
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ResponsiveDataTable>

      <div className="flex flex-col gap-3 border-t border-dashboard-border pt-4 text-sm text-dashboard-muted sm:flex-row sm:items-center sm:justify-between">
        <span>{meta.total} products</span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="glass"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="px-1">Page {meta.page} of {meta.totalPages}</span>
          <Button
            size="sm"
            variant="glass"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <AddProductChoiceModal
        open={choiceOpen}
        onClose={() => setChoiceOpen(false)}
        onSelectSingle={() => { setChoiceOpen(false); setEditingProduct(null); setWizardOpen(true); }}
        onSelectBulk={() => { setChoiceOpen(false); setBulkOpen(true); }}
      />

      {wizardOpen ? (
        editingProduct?.id && editingDetailLoading ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <LoadingState title="Loading product…" rows={3} />
          </div>
        ) : editingProduct?.id && editingDetailError ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <ErrorState
              title="Unable to load product"
              description={editingDetailFetchError?.message || 'Please try again.'}
              onRetry={() => { setWizardOpen(false); setEditingProduct(null); }}
            />
          </div>
        ) : (
          <ProductFormWizard
            key={editingProduct?.id ?? 'create'}
            mode={editingProduct ? 'edit' : 'create'}
            initialStep={wizardInitialStep}
            initialValues={editingProduct?.id && editingDetail
              ? mapProductDetailToFormValues(editingDetail)
              : undefined}
            isSubmitting={createCmsMutation.isPending || updateMutation.isPending || uploadImagesMutation.isPending}
            onClose={() => { setWizardOpen(false); setEditingProduct(null); setWizardInitialStep(0); }}
            onSubmit={handleSaveProduct}
          />
        )
      ) : null}

      <ProductDraftsPanel
        open={draftsOpen}
        onClose={() => setDraftsOpen(false)}
        onContinueEditing={handleContinueDraft}
        onPreview={handlePreviewDraft}
        onPublish={handlePublishDraft}
        onDelete={handleDeleteDraft}
        publishingId={publishingDraftId}
        deletingId={deletingDraftId}
      />

      {bulkOpen ? (
        <BulkUploadPanel
          onClose={() => setBulkOpen(false)}
          isValidating={validateBulkMutation.isPending}
          isImporting={importBulkMutation.isPending}
          onValidate={(rows) => validateBulkMutation.mutateAsync(rows)}
          onImport={async (rows) => {
            const result = await importBulkMutation.mutateAsync(rows);
            setPage(1);
            await queryClient.invalidateQueries({ queryKey: ['admin-products'], refetchType: 'active' });
            await refetch();
            return result;
          }}
        />
      ) : null}

      <ProductDetailDrawer
        product={selectedProductId ? (selectedDetail || null) : null}
        isLoading={Boolean(selectedProductId) && selectedDetailLoading}
        error={selectedDetailError ? (selectedDetailFetchError?.message || 'Unable to load product details.') : null}
        isSaving={updateMutation.isPending || adjustInventoryMutation.isPending}
        onClose={() => setSelectedProductId(null)}
        onEdit={(product) => { setSelectedProductId(null); setEditingProduct(product); setWizardOpen(true); }}
        onSaveChanges={handleSaveProductFields}
      />
    </div>
  );
}
