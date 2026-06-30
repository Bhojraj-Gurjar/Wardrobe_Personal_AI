'use client';

import { useEffect, useMemo } from 'react';
import { cn } from '@/utils/cn';

export function CameraPreview({
  videoRef,
  error,
  isReady,
  capturedImage,
  className,
}) {
  const previewSrc = useMemo(() => {
    if (!capturedImage) return null;
    if (typeof capturedImage === 'string') return capturedImage;
    return URL.createObjectURL(capturedImage);
  }, [capturedImage]);

  useEffect(() => {
    if (!previewSrc || typeof capturedImage === 'string') {
      return undefined;
    }

    return () => URL.revokeObjectURL(previewSrc);
  }, [previewSrc, capturedImage]);

  return (
    <div
      className={cn(
        'relative aspect-[4/3] overflow-hidden rounded-xl border border-auth-input-border bg-navy',
        className,
      )}
    >
      {previewSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewSrc}
          alt="Captured face preview"
          className="size-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn('size-full object-cover mirror', isReady ? 'opacity-100' : 'opacity-40')}
          aria-label="Live camera preview"
        />
      )}

      {!isReady && !capturedImage && !error ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-auth-panel-muted">
          Starting camera…
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-navy/90 p-4 text-center text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div
        className="pointer-events-none absolute inset-6 rounded-full border-2 border-primary/40"
        aria-hidden="true"
      />
    </div>
  );
}
