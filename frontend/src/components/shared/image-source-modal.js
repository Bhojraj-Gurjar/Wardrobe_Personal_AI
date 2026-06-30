'use client';

import { useEffect, useRef } from 'react';
import { Shield, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

function SourceCard({
  emoji,
  title,
  description,
  buttonLabel,
  variant = 'primary',
  disabled,
  onClick,
  buttonRef,
}) {
  const isPrimary = variant === 'primary';

  return (
    <div
      className={cn(
        'group flex flex-col rounded-2xl border p-5 transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(139,92,246,0.18)]',
        isPrimary
          ? 'border-primary/30 bg-gradient-to-br from-primary/15 via-[#111827] to-[#0B1020]'
          : 'border-white/10 bg-white/[0.04] backdrop-blur-md hover:border-primary/40',
      )}
    >
      <div
        className={cn(
          'mb-4 flex size-12 items-center justify-center rounded-xl',
          isPrimary ? 'bg-primary/20 text-primary' : 'bg-white/8 text-[#DDD6FE]',
        )}
      >
        {emoji ? <span className="text-2xl" aria-hidden="true">{emoji}</span> : null}
      </div>

      <h3 className="text-lg font-semibold text-dashboard-foreground">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-dashboard-muted">{description}</p>

      <Button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'mt-5 h-11 w-full rounded-xl transition-all duration-300',
          isPrimary
            ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:shadow-[0_0_28px_rgba(139,92,246,0.5)]'
            : 'border border-primary/40 bg-transparent text-primary hover:bg-primary/10',
        )}
        variant={isPrimary ? 'default' : 'outline'}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}

export function ImageSourceModal({
  open,
  onClose,
  onTakePhoto,
  onUpload,
  disabled = false,
  title = 'Choose Image Source',
  subtitle = 'Select how you want to perform your analysis.',
}) {
  const dialogRef = useRef(null);
  const firstFocusRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    firstFocusRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        if (!focusable.length) {
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#060b1f]/90 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        aria-label="Close"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-source-modal-title"
        className={cn(
          'relative w-full max-w-2xl rounded-3xl border border-white/10',
          'bg-[#0B1020]/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl',
          'animate-[fadeIn_0.25s_ease-out] sm:p-8',
        )}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={disabled}
          className="absolute right-4 top-4 rounded-full p-2 text-dashboard-muted transition-colors hover:bg-white/10 hover:text-dashboard-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <div className="pr-10">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Wardrobe AI
          </div>
          <h2 id="image-source-modal-title" className="text-2xl font-bold text-dashboard-foreground">
            {title}
          </h2>
          <p className="mt-2 text-sm text-dashboard-muted">{subtitle}</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <SourceCard
            emoji="📷"
            title="Take Photo"
            description="Use your device camera to capture a live image."
            buttonLabel="Open Camera"
            variant="primary"
            disabled={disabled}
            onClick={onTakePhoto}
            buttonRef={firstFocusRef}
          />
          <SourceCard
            emoji="🖼️"
            title="Upload Image"
            description="Choose an image from your device."
            buttonLabel="Upload Photo"
            variant="secondary"
            disabled={disabled}
            onClick={onUpload}
          />
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-emerald-300/90">
          <Shield className="size-4" aria-hidden="true" />
          <span>AI-protected analysis · Your images stay private</span>
        </div>
      </div>
    </div>
  );
}
