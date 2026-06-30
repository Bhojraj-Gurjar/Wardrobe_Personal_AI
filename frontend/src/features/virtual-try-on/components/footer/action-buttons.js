'use client';

import { Bookmark, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { VTO_GRADIENT_BUTTON, VTO_TRANSITION } from '../../styles/virtual-try-on-tokens';

export function ActionButtons({
  isGenerating,
  isSaving,
  isSaved,
  hasResult,
  canTryOn,
  onTryOn,
  onSaveLook,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        disabled={!canTryOn || isGenerating}
        onClick={onTryOn}
        aria-label={hasResult ? 'Regenerate try-on' : 'Try on now'}
        className={cn(
          'flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl text-base font-semibold text-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141B2D]',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
          VTO_GRADIENT_BUTTON,
          VTO_TRANSITION,
          'active:scale-[0.98]',
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles className="size-5" aria-hidden="true" />
            {hasResult ? 'Regenerate' : 'Try On Now'}
          </>
        )}
      </button>

      <button
        type="button"
        disabled={!hasResult || isSaving || isSaved}
        onClick={onSaveLook}
        aria-label="Save look"
        className={cn(
          'flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/[0.08] px-8',
          'text-sm font-semibold text-white/80',
          'hover:border-[#7C3AED]/40 hover:bg-white/[0.04] hover:text-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]',
          'disabled:cursor-not-allowed disabled:opacity-40',
          VTO_TRANSITION,
          'sm:min-w-[160px]',
        )}
      >
        {isSaving ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Bookmark className="size-4" aria-hidden="true" />
        )}
        {isSaved ? 'Saved' : 'Save Look'}
      </button>
    </div>
  );
}
