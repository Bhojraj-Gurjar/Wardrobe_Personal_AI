'use client';

import { RotateCcw, Shirt } from 'lucide-react';
import { cn } from '@/utils/cn';
import { resolveTryOnResultImageUrl } from '../../utils/try-on-image.util';
import { VTO_TRANSITION } from '../../styles/virtual-try-on-tokens';

export function GeneratedPreview({
  generatedImageUrl,
  isAddingToCloset,
  addedToCloset,
  onRegenerate,
  onAddToCloset,
}) {
  const resolvedUrl = resolveTryOnResultImageUrl(generatedImageUrl);

  if (!resolvedUrl) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col opacity-0 [animation:fadeIn_0.7s_ease-out_forwards]">
      <div className="relative flex min-h-[min(78vh,760px)] flex-1 items-center justify-center p-4 sm:p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedUrl}
          alt="Generated virtual try-on result"
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 px-5 pb-5">
        <button
          type="button"
          onClick={onRegenerate}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-medium text-white/70',
            'hover:border-[#7C3AED]/40 hover:text-white',
            VTO_TRANSITION,
          )}
        >
          <RotateCcw className="size-3.5" />
          Retry
        </button>

        {onAddToCloset ? (
          <button
            type="button"
            disabled={isAddingToCloset || addedToCloset}
            onClick={onAddToCloset}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-medium text-white/70',
              'hover:border-[#7C3AED]/40 hover:text-white disabled:opacity-50',
              VTO_TRANSITION,
            )}
          >
            <Shirt className="size-3.5" />
            {addedToCloset ? 'In Closet' : 'Add to Closet'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
