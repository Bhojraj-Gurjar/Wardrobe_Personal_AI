'use client';

import { Camera } from 'lucide-react';

export function EmptyPreview() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <div className="relative">
        <div
          className="absolute inset-0 scale-150 rounded-full bg-[#7C3AED]/20 blur-3xl"
          aria-hidden="true"
        />
        <span className="relative flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED]/30 to-[#A855F7]/20 text-[#A855F7] shadow-[0_0_48px_rgba(124,58,237,0.3)]">
          <Camera className="size-9" aria-hidden="true" />
        </span>
      </div>
      <h3 className="mt-8 text-2xl font-bold text-white">Ready to Try On</h3>
      <p className="mt-2 max-w-xs text-sm text-white/50">
        Upload your photo and select an outfit to begin
      </p>
    </div>
  );
}
