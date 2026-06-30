'use client';

import { Loader2, Sparkles } from 'lucide-react';

export function LoadingPreview({ loadingPhase, loadingProgress = 0 }) {
  const progress = Math.max(8, Math.min(loadingProgress || 35, 96));

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <div className="relative w-full max-w-lg">
        <div
          className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-gradient-to-b from-[#7C3AED]/10 via-white/5 to-transparent"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 rounded-2xl bg-[linear-gradient(110deg,transparent_25%,rgba(124,58,237,0.15)_50%,transparent_75%)] bg-size-[200%_100%] [animation:vto-shimmer_2s_ease-in-out_infinite]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <Loader2 className="size-12 animate-spin text-[#A855F7]" aria-hidden="true" />
            <Sparkles className="absolute -right-1 -top-1 size-4 animate-pulse text-[#7C3AED]" />
          </div>
          <div>
            <p className="text-base font-medium text-white">
              {loadingPhase || 'Generating Virtual Try-On...'}
            </p>
            <p className="mt-2 text-sm text-white/45">
              Preserving face, pose, and background while fitting garments naturally.
            </p>
          </div>
          <div className="mt-2 h-2 w-56 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
