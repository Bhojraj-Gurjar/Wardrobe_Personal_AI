'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Loader2, Upload, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { VTO_TRANSITION } from '../../styles/virtual-try-on-tokens';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function UploadDropzone({
  bodyPhotoUrl,
  previewKey,
  usingTemporaryPhoto,
  isUploading,
  uploadError,
  onUpload,
  onRemove,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState('');
  const [imageError, setImageError] = useState(false);

  const showPreview = Boolean(bodyPhotoUrl) && !imageError;
  const errorMessage = uploadError || localError;

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const openFilePicker = useCallback(() => {
    if (isUploading) {
      return;
    }

    resetFileInput();
    fileInputRef.current?.click();
  }, [isUploading, resetFileInput]);

  useEffect(() => {
    setImageError(false);
  }, [bodyPhotoUrl, previewKey]);

  const validateAndUpload = useCallback((file) => {
    if (!file) {
      return;
    }

    setLocalError('');

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError('Please upload a JPG or PNG image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setLocalError('Image must be 10MB or smaller.');
      return;
    }

    onUpload(file);
  }, [onUpload]);

  const handleFileInputChange = useCallback((event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    validateAndUpload(file);
  }, [validateAndUpload]);

  const handleRemove = useCallback(() => {
    resetFileInput();
    onRemove?.();
  }, [onRemove, resetFileInput]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    validateAndUpload(file);
  }, [validateAndUpload]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  if (showPreview) {
    return (
      <div className="relative">
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border border-white/[0.08]',
            VTO_TRANSITION,
          )}
        >
          <div className="relative aspect-[3/4] min-h-[220px] bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={previewKey || bodyPhotoUrl}
              src={bodyPhotoUrl}
              alt="Your uploaded body photo"
              onError={() => setImageError(true)}
              className="size-full object-cover object-top"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090B18]/80 via-transparent to-transparent"
              aria-hidden="true"
            />
          </div>

          {usingTemporaryPhoto ? (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-[#7C3AED]/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              Session Photo
            </span>
          ) : (
            <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              <Check className="size-3" aria-hidden="true" />
              Onboarding
            </span>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={openFilePicker}
            disabled={isUploading}
            className={cn(
              'flex-1 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-medium text-white/90',
              'hover:border-[#7C3AED]/40 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]',
              VTO_TRANSITION,
            )}
          >
            Replace Photo
          </button>
          {usingTemporaryPhoto ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              aria-label="Remove uploaded photo"
              className={cn(
                'rounded-xl border border-white/[0.08] px-3 py-2.5 text-white/70',
                'hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50',
                VTO_TRANSITION,
              )}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload your photo"
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openFilePicker();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFilePicker}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center',
          VTO_TRANSITION,
          isDragging
            ? 'border-[#7C3AED] bg-[#7C3AED]/10 shadow-[0_0_32px_rgba(124,58,237,0.25)]'
            : 'border-white/15 bg-black/20 hover:border-[#7C3AED]/50 hover:bg-[#7C3AED]/5',
          isUploading && 'pointer-events-none opacity-70',
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="size-10 animate-spin text-[#A855F7]" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium text-white">Uploading photo…</p>
          </>
        ) : (
          <>
            <span className="flex size-14 items-center justify-center rounded-2xl bg-[#7C3AED]/15 text-[#A855F7]">
              <Upload className="size-7" aria-hidden="true" />
            </span>
            <p className="mt-4 text-base font-semibold text-white">Upload your photo</p>
            <p className="mt-1 text-sm text-white/50">Full-body photo works best</p>
            <p className="mt-0.5 text-xs text-white/40">JPG, PNG up to 10MB</p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openFilePicker();
              }}
              className={cn(
                'mt-5 rounded-xl px-6 py-2.5 text-sm font-semibold text-white',
                'bg-gradient-to-r from-[#7C3AED] to-[#A855F7]',
                'hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7]',
                VTO_TRANSITION,
              )}
            >
              Choose Photo
            </button>
          </>
        )}
      </div>

      {errorMessage ? (
        <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {errorMessage}
        </p>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileInputChange}
      />
    </div>
  );
}
