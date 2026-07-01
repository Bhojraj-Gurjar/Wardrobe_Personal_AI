'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Rocket,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import { resolveProductImageUrl } from '@/utils/product-image';
import { useAdminDraftProductsQuery } from '@/features/admin/hooks';

type DraftProduct = {
  id: string;
  name?: string;
  sku?: string;
  brand?: string;
  category?: string;
  imageUrl?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ProductDraftsPanelProps = {
  open: boolean;
  onClose: () => void;
  onContinueEditing: (product: DraftProduct) => void;
  onPreview: (product: DraftProduct) => void;
  onPublish: (product: DraftProduct) => void;
  onDelete: (product: DraftProduct) => void;
  publishingId?: string | null;
  deletingId?: string | null;
};

function DraftActionsMenu({
  product,
  onContinueEditing,
  onPreview,
  onPublish,
  onDelete,
  publishingId,
  deletingId,
}: {
  product: DraftProduct;
  onContinueEditing: (product: DraftProduct) => void;
  onPreview: (product: DraftProduct) => void;
  onPublish: (product: DraftProduct) => void;
  onDelete: (product: DraftProduct) => void;
  publishingId?: string | null;
  deletingId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const isPublishing = publishingId === product.id;
  const isDeleting = deletingId === product.id;
  const isBusy = isPublishing || isDeleting;

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-lg"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Draft actions"
        disabled={isBusy}
      >
        {isBusy ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
      </Button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#12182c]/95 py-1 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-white/5"
              onClick={() => { onContinueEditing(product); setOpen(false); }}
            >
              <Pencil className="size-4 text-purple-400" />
              Continue Editing
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-white/5"
              onClick={() => { onPreview(product); setOpen(false); }}
            >
              <Eye className="size-4 text-sky-400" />
              Preview
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-white/5"
              onClick={() => { onPublish(product); setOpen(false); }}
              disabled={isPublishing}
            >
              <Rocket className="size-4 text-emerald-400" />
              Publish Product
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
              onClick={() => { onDelete(product); setOpen(false); }}
              disabled={isDeleting}
            >
              <Trash2 className="size-4" />
              Delete Draft
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function formatDraftDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DraftEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative mb-6 flex size-28 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 via-violet-500/10 to-transparent blur-xl" />
        <div className="relative flex size-24 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-[0_8px_32px_rgba(139,92,246,0.15)]">
          <FileText className="size-11 text-purple-300" strokeWidth={1.5} />
        </div>
      </div>
      <h4 className="text-lg font-semibold text-white">No Draft Products Found</h4>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        Products saved as drafts will appear here.
      </p>
    </div>
  );
}

export function ProductDraftsPanel({
  open,
  onClose,
  onContinueEditing,
  onPreview,
  onPublish,
  onDelete,
  publishingId,
  deletingId,
}: ProductDraftsPanelProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(() => ({
    search: search || undefined,
    page,
    limit: 10,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  }), [search, page]);

  const { data, isLoading, isError, refetch } = useAdminDraftProductsQuery(params, { enabled: open });

  const drafts = (data?.items || []) as DraftProduct[];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-drafts-title"
          className={cn(
            'flex max-h-[min(92dvh,860px)] w-full max-w-6xl flex-col overflow-hidden',
            'rounded-t-2xl border border-white/10 bg-[#0b1020]/95 shadow-[0_28px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl',
            'sm:rounded-2xl',
          )}
        >
          <div className="shrink-0 border-b border-white/10 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
                    <FileText className="size-4" />
                  </span>
                  <h3 id="product-drafts-title" className="text-xl font-semibold text-white">
                    Draft Products
                  </h3>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  Saved drafts from the Add Product wizard — edit, preview, or publish when ready.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 p-2 text-slate-400 transition-colors hover:border-purple-500/40 hover:bg-white/5 hover:text-white"
                aria-label="Close drafts"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-5">
              <Input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Search drafts by name, SKU, or brand..."
                className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <LoadingState title="Loading drafts…" rows={4} />
            ) : isError ? (
              <ErrorState title="Unable to load drafts" onRetry={refetch} />
            ) : drafts.length === 0 ? (
              <DraftEmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-sm">
                  <thead className="sticky top-0 z-10 bg-[#0f1528]/95 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm">
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-3">Product</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Brand</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Last Updated</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drafts.map((draft, index) => (
                      <motion.tr
                        key={draft.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                              {draft.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={resolveProductImageUrl(draft.imageUrl)}
                                  alt=""
                                  className="size-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-slate-500">
                                  {draft.name?.[0] || '?'}
                                </span>
                              )}
                            </span>
                            <p className="max-w-[220px] truncate font-medium text-white">{draft.name || 'Untitled draft'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-purple-300/90">{draft.sku || '—'}</td>
                        <td className="px-4 py-4 text-slate-300">{draft.brand || '—'}</td>
                        <td className="px-4 py-4 text-slate-400">{draft.category || '—'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-slate-400">{formatDraftDate(draft.updatedAt)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-slate-400">{formatDraftDate(draft.createdAt)}</td>
                        <td className="px-4 py-4 text-center">
                          <Badge className="bg-slate-500/15 text-slate-300">Draft</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hidden gap-1.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white lg:inline-flex"
                              onClick={() => onContinueEditing(draft)}
                            >
                              <Pencil className="size-3.5" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hidden gap-1.5 rounded-lg text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200 lg:inline-flex"
                              onClick={() => onPublish(draft)}
                              disabled={publishingId === draft.id}
                            >
                              {publishingId === draft.id
                                ? <Loader2 className="size-3.5 animate-spin" />
                                : <Rocket className="size-3.5" />}
                              Publish
                            </Button>
                            <DraftActionsMenu
                              product={draft}
                              onContinueEditing={onContinueEditing}
                              onPreview={onPreview}
                              onPublish={onPublish}
                              onDelete={onDelete}
                              publishingId={publishingId}
                              deletingId={deletingId}
                            />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {drafts.length > 0 ? (
            <div className="flex shrink-0 items-center justify-between border-t border-white/10 px-6 py-4 text-sm text-slate-400">
              <span>
                {meta.total || drafts.length} draft{(meta.total || drafts.length) === 1 ? '' : 's'}
                {' · '}
                Page {meta.page || page} of {meta.totalPages || 1}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 rounded-lg text-slate-300"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 rounded-lg text-slate-300"
                  disabled={page >= (meta.totalPages || 1)}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useAdminDraftCount() {
  const { data } = useAdminDraftProductsQuery(
    { page: 1, limit: 1, sortBy: 'updatedAt', sortOrder: 'desc' },
  );

  return data?.meta?.total ?? 0;
}
