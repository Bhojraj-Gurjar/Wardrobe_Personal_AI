'use client';

import { Camera, RotateCcw, ArrowRight } from 'lucide-react';
import { CameraPreview } from '@/features/face/components/camera-preview';
import { Button } from '@/components/ui/button';

export function CaptureCard({
  videoRef,
  error,
  isReady,
  capturedImage,
  onCapture,
  onRetake,
  onContinue,
  continueLabel = 'Continue',
  captureLabel = 'Capture',
  continueDisabled = false,
}) {
  return (
    <div className="space-y-4">
      <CameraPreview
        videoRef={videoRef}
        error={error}
        isReady={isReady}
        capturedImage={capturedImage}
      />

      <div className="flex flex-wrap gap-3">
        {!capturedImage ? (
          <Button
            type="button"
            className="flex-1 rounded-xl"
            onClick={onCapture}
            disabled={!isReady}
          >
            <Camera className="size-4" aria-hidden="true" />
            {captureLabel}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl border-auth-input-border bg-auth-input-bg text-auth-panel-foreground"
              onClick={onRetake}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Retake
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-xl"
              onClick={onContinue}
              disabled={continueDisabled}
            >
              {continueLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
