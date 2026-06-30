'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, ShieldCheck, X } from 'lucide-react';
import { useCamera } from '@/features/face/hooks/use-camera';
import { useFaceLivenessChallenge } from '@/features/face/hooks/use-face-liveness-challenge';
import { PremiumFaceScanner } from '@/features/face/components/premium-face-scanner';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function FacePhotoCaptureDialog({
  open,
  title = 'Update face photo',
  description = 'Live camera verification is required. Image uploads are disabled.',
  submitLabel = 'Save photo',
  isSubmitting = false,
  errorMessage = '',
  onClose,
  onSubmit,
}) {
  const detectorRef = useRef(null);
  const [localError, setLocalError] = useState('');
  const camera = useCamera();
  const liveness = useFaceLivenessChallenge({ camera, detectorRef });

  useEffect(() => {
    if (!open) {
      setLocalError('');
      liveness.reset();
      camera.stop();
      return undefined;
    }

    void camera.start();

    return () => {
      camera.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSave = async () => {
    setLocalError('');

    try {
      const securePayload = await liveness.runLivenessFlow();
      if (!securePayload?.frames?.length) {
        setLocalError('Hold still for a second while we capture your face.');
        return;
      }

      await onSubmit?.(securePayload);
    } catch (err) {
      setLocalError(err?.message || "We couldn't verify your face clearly. Please try again.");
    }
  };

  const displayError = errorMessage || localError || camera.error;
  const isBusy = isSubmitting || liveness.phase === 'capturing';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060b1f]/95 p-4 backdrop-blur-md">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/12 bg-[#111827] p-6 shadow-2xl shadow-black/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="face-photo-dialog-title"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 rounded-full p-1 text-dashboard-muted transition-colors hover:bg-white/10 hover:text-dashboard-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <div className="space-y-2 pr-8">
          <h2 id="face-photo-dialog-title" className="text-xl font-semibold text-dashboard-foreground">
            {title}
          </h2>
          <p className="text-sm text-dashboard-muted">{description}</p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="mx-auto w-fit">
            <PremiumFaceScanner
              videoRef={camera.videoRef}
              isActive
              isReady={camera.isReady}
              isScanning={isBusy}
              progress={liveness.progress}
              guidance={liveness.guidance}
              challengeLabel={liveness.challenge?.label || null}
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-emerald-300/90">
            <ShieldCheck className="size-4" aria-hidden="true" />
            <span>Secure live capture only</span>
          </div>

          <p className="text-center text-sm text-[#DDD6FE]">{liveness.challengeLabel}</p>

          <Button
            type="button"
            className={cn('w-full bg-[#8B5CF6] text-white hover:bg-[#7C3AED]')}
            onClick={handleSave}
            disabled={isBusy || !camera.isReady}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Camera className="mr-2 size-4" />
                {submitLabel}
              </>
            )}
          </Button>

          {displayError ? (
            <p className="text-sm text-red-400">{displayError}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
