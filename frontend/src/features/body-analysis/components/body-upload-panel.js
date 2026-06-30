'use client';

import { useEffect, useRef } from 'react';
import { Check, ImageUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { BODY_UPLOAD_ACCEPT } from '../constants/body-upload.constants';

const BEST_PRACTICES = [
  'Stand Straight',
  'Keep Entire Body Visible',
  'Include Both Feet',
  'Good Lighting',
  'Neutral Background',
];

export function BodyUploadPanel({
  open,
  onClose,
  onFileSelected,
  isBusy = false,
  errorMessage = '',
}) {
  const fileInputRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isBusy) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isBusy, onClose, open]);

  if (!open) {
    return null;
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (file) {
      onFileSelected?.(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#060b1f]/90 backdrop-blur-md"
        aria-label="Close"
        onClick={() => {
          if (!isBusy) {
            onClose?.();
          }
        }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="body-upload-panel-title"
        className={cn(
          'relative w-full max-w-lg rounded-3xl border border-white/10',
          'bg-[#0B1020]/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl',
          'animate-[fadeIn_0.25s_ease-out] sm:p-8',
        )}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="absolute right-4 top-4 rounded-full p-2 text-dashboard-muted transition-colors hover:bg-white/10 hover:text-dashboard-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <div className="pr-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A78BFA]">
            Body Analysis
          </p>
          <h2 id="body-upload-panel-title" className="mt-2 text-2xl font-bold text-dashboard-foreground">
            Upload Full Body Photo
          </h2>
        </div>

        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap gap-2 text-sm text-dashboard-muted">
            {['JPG', 'PNG', 'WEBP'].map((format) => (
              <span
                key={format}
                className="inline-flex items-center gap-1 rounded-full border border-[#8B5CF6]/25 bg-[#8B5CF6]/10 px-3 py-1 text-[#DDD6FE]"
              >
                <Check className="size-3.5 text-emerald-400" />
                {format}
              </span>
            ))}
          </div>

          <p className="text-sm text-dashboard-muted">Maximum Size: 10MB</p>

          <div className="rounded-2xl border border-dashboard-border/70 bg-dashboard-bg/40 p-4">
            <p className="text-sm font-semibold text-dashboard-foreground">Best Results</p>
            <ul className="mt-3 space-y-2">
              {BEST_PRACTICES.map((tip) => (
                <li key={tip} className="flex items-center gap-2 text-sm text-dashboard-muted">
                  <span className="size-1.5 rounded-full bg-[#8B5CF6]" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={BODY_UPLOAD_ACCEPT}
            className="hidden"
            onChange={handleFileChange}
          />

          <Button
            type="button"
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
            className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white transition-all hover:from-[#7C3AED] hover:to-[#6D28D9] hover:shadow-[0_0_24px_rgba(139,92,246,0.35)]"
          >
            <ImageUp className="mr-2 size-4" />
            Upload Full Body Photo
          </Button>

          {errorMessage ? (
            <p className="text-sm text-red-400">{errorMessage}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
