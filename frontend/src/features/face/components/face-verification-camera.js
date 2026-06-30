'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  useCamera,
  useFaceLogoutVerifyMutation,
  useFaceVerifyMutation,
} from '@/features/face/hooks';
import { getFaceErrorMessage, FACE_CAPTURE_FAILED_MESSAGE } from '@/features/face/utils/face-errors';
import {
  FACE_AI_TIMEOUT_MS,
  FACE_CAPTURE_WARMUP_MS,
  FACE_VERIFY_TIMEOUT_MESSAGE,
} from '@/features/face/constants/face-timeouts';
import { FaceVerifyingOverlay } from '@/features/face/components/face-verifying-overlay';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

const VERIFY_TIMEOUT_MS = FACE_AI_TIMEOUT_MS;

function isCameraPermissionError(message) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes('denied') || lower.includes('permission') || lower.includes('notallowed');
}

export function FaceVerificationCamera({
  onVerified,
  onCameraDenied,
  autoVerify = true,
  purpose = 'verify',
}) {
  const camera = useCamera();
  const verifyMutation = useFaceVerifyMutation();
  const logoutVerifyMutation = useFaceLogoutVerifyMutation();
  const verifyForPurpose = purpose === 'logout' ? logoutVerifyMutation : verifyMutation;
  const [isVerifying, setIsVerifying] = useState(false);
  const [captureReady, setCaptureReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const verifyStartedRef = useRef(false);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    camera.start();
    return () => camera.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (camera.error && isCameraPermissionError(camera.error)) {
      onCameraDenied?.();
    }
  }, [camera.error, onCameraDenied]);

  useEffect(() => {
    if (!camera.isReady) {
      setCaptureReady(false);
      return undefined;
    }

    const timer = setTimeout(() => setCaptureReady(true), FACE_CAPTURE_WARMUP_MS);
    return () => {
      clearTimeout(timer);
      setCaptureReady(false);
    };
  }, [camera.isReady]);

  const runVerify = useCallback(async () => {
    setIsVerifying(true);
    setErrorMessage(null);

    const timeout = setTimeout(() => {
      setIsVerifying(false);
      verifyStartedRef.current = false;
      autoStartedRef.current = false;
      setErrorMessage(FACE_VERIFY_TIMEOUT_MESSAGE);
    }, VERIFY_TIMEOUT_MS);

    try {
      const frame = await camera.captureFrame();
      if (!frame) {
        verifyStartedRef.current = false;
        autoStartedRef.current = false;
        setErrorMessage(FACE_CAPTURE_FAILED_MESSAGE);
        return;
      }

      const result = await verifyForPurpose.mutateAsync(frame);
      camera.stop();
      onVerified(result);
    } catch (err) {
      verifyStartedRef.current = false;
      autoStartedRef.current = false;
      setErrorMessage(getFaceErrorMessage(err, 'Face not recognized.', 'verify'));
    } finally {
      clearTimeout(timeout);
      setIsVerifying(false);
    }
  }, [camera, onVerified, verifyForPurpose]);

  useEffect(() => {
    if (
      !autoVerify
      || !camera.isReady
      || !captureReady
      || isVerifying
      || verifyStartedRef.current
      || camera.error
      || autoStartedRef.current
    ) {
      return;
    }

    autoStartedRef.current = true;
    verifyStartedRef.current = true;
    runVerify();
  }, [
    autoVerify,
    camera.isReady,
    captureReady,
    camera.error,
    isVerifying,
    runVerify,
  ]);

  const handleRetry = () => {
    if (isVerifying) return;
    verifyStartedRef.current = true;
    autoStartedRef.current = true;
    runVerify();
  };

  if (camera.error && isCameraPermissionError(camera.error)) {
    return null;
  }

  const isBusy = isVerifying || verifyForPurpose.isPending;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'relative aspect-[4/3] overflow-hidden rounded-xl border border-dashboard-border',
          'bg-dashboard-surface-elevated',
        )}
      >
        <video
          ref={camera.videoRef}
          autoPlay
          playsInline
          muted
          className="mirror size-full object-cover"
          aria-label="Live camera preview"
        />

        {!camera.isReady ? (
          <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Starting camera…
          </div>
        ) : null}

        {isBusy ? <FaceVerifyingOverlay message="Verifying your identity..." /> : null}
      </div>

      {!isBusy && camera.isReady && !errorMessage ? (
        <p className="text-center text-sm text-dashboard-muted">
          Hold still — verifying automatically…
        </p>
      ) : null}

      {errorMessage ? (
        <>
          <p className="text-center text-sm text-red-400" role="alert">
            {errorMessage}
          </p>
          <Button
            type="button"
            className="h-12 w-full rounded-xl"
            onClick={handleRetry}
            disabled={!camera.isReady || isBusy}
          >
            Retry Scan
          </Button>
        </>
      ) : null}
    </div>
  );
}
