'use client';

import { useCallback, useEffect, useState } from 'react';
import { Camera, ImageUp, Loader2, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useCamera } from '@/features/face/hooks/use-camera';
import { useFaceCaptureGuidance } from '@/features/face/hooks/use-face-capture-guidance';
import { PremiumFaceScanner } from '@/features/face/components/premium-face-scanner';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

const STATUS_LABELS = {
  initializing: 'Opening camera…',
  detecting: 'Detecting face…',
  ready: 'Ready to capture',
  capturing: 'Analyzing…',
  saving: 'Saving results…',
};

function isCameraPermissionError(message = '') {
  const lower = String(message).toLowerCase();
  return lower.includes('denied') || lower.includes('permission') || lower.includes('notallowed');
}

export function SimplePhotoCaptureDialog({
  open,
  title = 'Capture photo',
  description = 'Position yourself in the frame, then capture.',
  submitLabel = 'Capture & analyze',
  isSubmitting = false,
  errorMessage = '',
  onClose,
  onSubmit,
  onUploadInstead,
}) {
  const camera = useCamera();
  const [localError, setLocalError] = useState('');
  const [flowStatus, setFlowStatus] = useState('initializing');
  const [isCapturing, setIsCapturing] = useState(false);

  const { guidance, faceReady, status: guidanceStatus } = useFaceCaptureGuidance({
    videoRef: camera.videoRef,
    enabled: open,
    isReady: camera.isReady,
  });

  const startCamera = useCallback(async () => {
    setLocalError('');
    setFlowStatus('initializing');
    await camera.restart();
  }, [camera]);

  useEffect(() => {
    if (!open) {
      setLocalError('');
      setFlowStatus('initializing');
      setIsCapturing(false);
      camera.stop();
      return undefined;
    }

    void startCamera();

    return () => {
      camera.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || isCapturing || isSubmitting) {
      return undefined;
    }

    if (camera.isReady && guidanceStatus === 'ready') {
      setFlowStatus('ready');
    } else if (camera.isReady) {
      setFlowStatus('detecting');
    } else {
      setFlowStatus('initializing');
    }
  }, [camera.isReady, guidanceStatus, isCapturing, isSubmitting, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting && !isCapturing) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCapturing, isSubmitting, onClose, open]);

  if (!open) {
    return null;
  }

  const displayError = errorMessage || localError || camera.error;
  const permissionDenied = isCameraPermissionError(displayError);
  const isBusy = isSubmitting || isCapturing || flowStatus === 'initializing';
  const statusLabel = isSubmitting
    ? STATUS_LABELS.saving
    : isCapturing
      ? STATUS_LABELS.capturing
      : STATUS_LABELS[flowStatus] || STATUS_LABELS.detecting;

  const handleCapture = async () => {
    setLocalError('');
    setIsCapturing(true);
    setFlowStatus('capturing');

    try {
      const blob = await camera.captureFrame();
      if (!blob) {
        setLocalError('Could not capture image. Hold still and try again.');
        return;
      }

      const file = new File([blob], 'capture.jpg', { type: blob.type || 'image/jpeg' });
      await onSubmit?.(file, { source: 'camera' });
    } catch (err) {
      setLocalError(err?.message || 'Capture failed. Please try again.');
    } finally {
      setIsCapturing(false);
      if (!isSubmitting) {
        setFlowStatus(camera.isReady ? 'detecting' : 'initializing');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060b1f]/95 p-4 backdrop-blur-md">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={() => {
          if (!isBusy) {
            onClose?.();
          }
        }}
      />

      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/12 bg-[#111827] p-6 shadow-2xl shadow-black/50 animate-[fadeIn_0.25s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="simple-photo-dialog-title"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="absolute right-4 top-4 rounded-full p-1 text-dashboard-muted transition-colors hover:bg-white/10 hover:text-dashboard-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <div className="space-y-2 pr-8">
          <h2 id="simple-photo-dialog-title" className="text-xl font-semibold text-dashboard-foreground">
            {title}
          </h2>
          <p className="text-sm text-dashboard-muted">{description}</p>
          <p className="text-xs font-medium text-[#C4B5FD]">{statusLabel}</p>
        </div>

        <div className="mt-6 space-y-4">
          {permissionDenied ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              <p className="font-medium">Camera permission denied.</p>
              <p className="mt-1 text-amber-100/80">
                Please allow camera access or upload an image instead.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full border-primary/40 text-primary"
                onClick={onUploadInstead}
              >
                <ImageUp className="mr-2 size-4" />
                Upload Image
              </Button>
            </div>
          ) : (
            <>
              <div className="mx-auto w-fit">
                <PremiumFaceScanner
                  videoRef={camera.videoRef}
                  isActive
                  isReady={camera.isReady}
                  isScanning={isCapturing || flowStatus === 'detecting'}
                  progress={faceReady ? 88 : flowStatus === 'detecting' ? 42 : 12}
                />
              </div>

              <p className="text-center text-sm text-[#DDD6FE]">
                {flowStatus === 'initializing' ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Opening camera…
                  </span>
                ) : (
                  guidance
                )}
              </p>

              {camera.devices.length > 1 ? (
                <div className="flex items-center gap-2">
                  <select
                    value={camera.activeDeviceId || ''}
                    onChange={(event) => {
                      void camera.switchDevice(event.target.value);
                    }}
                    disabled={isBusy}
                    className="h-10 flex-1 rounded-lg border border-dashboard-border bg-dashboard-bg px-3 text-sm"
                    aria-label="Select camera"
                  >
                    {camera.devices.map((device, index) => (
                      <option key={device.deviceId || `camera-${index}`} value={device.deviceId}>
                        {device.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={isBusy}
                    onClick={() => { void startCamera(); }}
                    aria-label="Restart camera"
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                </div>
              ) : null}

              <div className="flex items-center justify-center gap-2 text-xs text-emerald-300/90">
                <ShieldCheck className="size-4" aria-hidden="true" />
                <span>Secure live capture</span>
              </div>

              <Button
                type="button"
                className={cn('w-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white hover:from-[#7C3AED] hover:to-[#6D28D9]')}
                onClick={handleCapture}
                disabled={isBusy || !camera.isReady || !faceReady}
              >
                {isSubmitting || isCapturing ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {isSubmitting ? 'Saving results…' : 'Capturing…'}
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 size-4" />
                    {submitLabel}
                  </>
                )}
              </Button>
            </>
          )}

          {displayError && !permissionDenied ? (
            <p className="text-sm text-red-400">{displayError}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
