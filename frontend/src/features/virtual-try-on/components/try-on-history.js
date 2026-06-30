'use client';

import Image from 'next/image';
import {
  Check,
  Download,
  Heart,
  Loader2,
  Shirt,
  Trash2,
} from 'lucide-react';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { resolveTryOnResultImageUrl } from '../utils/try-on-image.util';
import { VTO_CARD_CLASS } from '../styles/virtual-try-on-tokens';

function downloadImage(url, filename) {
  if (!url) {
    return;
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TryOnHistory({
  results = [],
  isLoading,
  busyResultId,
  onSaveOutfit,
  onAddToCloset,
  onDelete,
  savedResultIds = {},
  closetResultIds = {},
}) {
  return (
    <section className={cn(VTO_CARD_CLASS, 'overflow-hidden')}>
      <div className="border-b border-white/[0.08] px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A855F7]">
          Result History
        </p>
        <p className="mt-1 text-sm text-white/50">
          Previous try-ons — save, download, or add to your closet.
        </p>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-8 text-center text-sm text-white/50">
            No try-on results yet. Pick a product and click Try On.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {results.map((result) => {
              if (!result?.id) {
                return null;
              }

              const isBusy = busyResultId === result.id;
              const product = result.product;
              const imageUrl = resolveTryOnResultImageUrl(
                result.generatedImageUrl || result.generatedImage,
              );

              return (
                <article
                  key={result.id}
                  className={cn(
                    'overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20',
                    'transition-all duration-300 hover:border-white/20',
                  )}
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-dashboard-surface-elevated">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product?.name || 'Try-on result'}
                        fill
                        sizes="(max-width: 768px) 100vw, 320px"
                        className="object-cover object-top"
                        loading="lazy"
                      />
                    ) : null}
                  </div>

                  <div className="space-y-3 p-4">
                    <div>
                      <p className="truncate text-sm font-medium text-dashboard-foreground">
                        {product?.name || 'Try-on look'}
                      </p>
                      <p className="text-xs text-dashboard-muted">
                        {product?.brand} · {formatDate(result.createdAt)}
                      </p>
                      {product?.price ? (
                        <p className="mt-1 text-xs font-medium text-[#C4B5FD]">
                          {formatProductPrice(product.price, product.currency)}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy || savedResultIds[result.id]}
                        onClick={() => onSaveOutfit(result)}
                        className="rounded-xl border-white/15 bg-transparent text-xs hover:bg-white/5"
                      >
                        {savedResultIds[result.id] ? (
                          <>
                            <Check className="mr-1 size-3.5 text-emerald-400" />
                            Saved
                          </>
                        ) : isBusy ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <>
                            <Heart className="mr-1 size-3.5" />
                            Save Outfit
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => downloadImage(
                          imageUrl,
                          `try-on-${result.id}.png`,
                        )}
                        className="rounded-xl border-white/15 bg-transparent text-xs hover:bg-white/5"
                      >
                        <Download className="mr-1 size-3.5" />
                        Download
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy || closetResultIds[result.id]}
                        onClick={() => onAddToCloset(result)}
                        className="rounded-xl border-white/15 bg-transparent text-xs hover:bg-white/5"
                      >
                        {closetResultIds[result.id] ? (
                          <>
                            <Check className="mr-1 size-3.5 text-emerald-400" />
                            In Closet
                          </>
                        ) : (
                          <>
                            <Shirt className="mr-1 size-3.5" />
                            Add to Closet
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => onDelete(result.id)}
                        className="rounded-xl border-red-500/30 bg-transparent text-xs text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="mr-1 size-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
