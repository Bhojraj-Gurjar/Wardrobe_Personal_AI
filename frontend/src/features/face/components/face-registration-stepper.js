'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  FACE_REGISTRATION_FLOW_TIMEOUT_MS,
  FACE_VERIFY_TIMEOUT_MESSAGE,
} from '@/features/face/constants/face-timeouts';
import { FACE_LIVENESS_PHASE } from '@/features/face/constants/face-liveness-challenges';
import { useCamera, useFaceRegisterMutation } from '@/features/face/hooks';
import { FACE_AUTH_CAPTURE_SETTINGS } from '@/features/face/constants/face-capture-settings';
import { useFaceLivenessChallenge } from '@/features/face/hooks/use-face-liveness-challenge';
import { getFaceErrorMessage, FACE_CAPTURE_FAILED_MESSAGE } from '@/features/face/utils/face-errors';
import { PremiumFaceScanner } from '@/features/face/components/premium-face-scanner';
import {
  FaceAuthLayout,
  FaceAuthRetryActions,
  faceAuthBackLinkClass,
  faceAuthStatusTextClass,
} from '@/features/face/components/face-auth-layout';
import { cn } from '@/utils/cn';
import { ROUTES } from '@/constants/routes';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { FaceFlowLog } from '@/features/face/utils/face-flow-log';
import { setFaceAuthSuccessMessage } from '@/features/face/utils/face-auth-success';

const VERIFY_TIMEOUT_MS = FACE_REGISTRATION_FLOW_TIMEOUT_MS;
const MAX_AUTO_RETRIES = 1;

export function FaceRegistrationStepper() {
  const router = useRouter();
  const camera = useCamera({
    captureMaxWidth: FACE_AUTH_CAPTURE_SETTINGS.captureMaxWidth,
    captureQuality: FACE_AUTH_CAPTURE_SETTINGS.captureQuality,
  });
  const registerMutation = useFaceRegisterMutation();
  const detectorRef = useRef(null);
  const flowStartedRef = useRef(false);
  const consecutiveFailuresRef = useRef(0);

  const liveness = useFaceLivenessChallenge({
    camera,
    detectorRef,
    positionStableMs: FACE_AUTH_CAPTURE_SETTINGS.positionStableMs,
    stableFrameCount: FACE_AUTH_CAPTURE_SETTINGS.stableFrameCount,
    maxFrames: FACE_AUTH_CAPTURE_SETTINGS.maxFrames,
    minFrames: FACE_AUTH_CAPTURE_SETTINGS.minFrames,
    captureIntervalMs: FACE_AUTH_CAPTURE_SETTINGS.captureIntervalMs,
    detectionIntervalMs: FACE_AUTH_CAPTURE_SETTINGS.detectionIntervalMs,
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let active = true;

    const bootCamera = async () => {
      await camera.start();
      if (!active) {
        camera.stop();
      }
    };

    bootCamera();

    return () => {
      active = false;
      camera.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runRegistration = useCallback(async () => {
    if (flowStartedRef.current) {
      return;
    }

    flowStartedRef.current = true;
    setIsVerifying(true);
    setErrorMessage(null);
    liveness.reset();

    const timeout = setTimeout(() => {
      setIsVerifying(false);
      flowStartedRef.current = false;
      setErrorMessage(FACE_VERIFY_TIMEOUT_MESSAGE);
    }, VERIFY_TIMEOUT_MS);

    try {
      const securePayload = await liveness.runLivenessFlow();
      if (!securePayload?.frames?.length) {
        flowStartedRef.current = false;
        setErrorMessage(FACE_CAPTURE_FAILED_MESSAGE);
        return;
      }

      await registerMutation.mutateAsync(securePayload);
      consecutiveFailuresRef.current = 0;
      FaceFlowLog.embeddingSaved();
      FaceFlowLog.registrationSuccess();
      setFaceAuthSuccessMessage('Face Registered Successfully');
      camera.stop();
      useOnboardingStore.getState().resetOnboarding();
      router.replace(ROUTES.ONBOARDING.PROFILE);
    } catch (err) {
      flowStartedRef.current = false;

      if (consecutiveFailuresRef.current < MAX_AUTO_RETRIES) {
        consecutiveFailuresRef.current += 1;
        liveness.reset();
        setErrorMessage(null);
        setIsVerifying(true);
        try {
          const retryPayload = await liveness.runLivenessFlow();
          if (retryPayload?.frames?.length) {
            await registerMutation.mutateAsync(retryPayload);
            consecutiveFailuresRef.current = 0;
            FaceFlowLog.registrationSuccess();
            setFaceAuthSuccessMessage('Face Registered Successfully');
            camera.stop();
            useOnboardingStore.getState().resetOnboarding();
            router.replace(ROUTES.ONBOARDING.PROFILE);
            return;
          }
        } catch {
          // fall through to user-visible error below
        }
      }

      consecutiveFailuresRef.current = 0;
      setErrorMessage(getFaceErrorMessage(err, 'Face verification failed.', 'register'));
    } finally {
      clearTimeout(timeout);
      setIsVerifying(false);
    }
  }, [camera, liveness, registerMutation, router]);

  const handleRetry = useCallback(() => {
    flowStartedRef.current = false;
    consecutiveFailuresRef.current = 0;
    setErrorMessage(null);
    setIsVerifying(false);
    liveness.reset();
    void camera.start().then(() => runRegistration());
  }, [camera, liveness, runRegistration]);

  useEffect(() => {
    if (camera.error) {
      setErrorMessage(
        getFaceErrorMessage({ message: camera.error }, 'Camera permission denied.', 'register'),
      );
    }
  }, [camera.error]);

  useEffect(() => {
    if (!camera.isReady || camera.error || errorMessage || flowStartedRef.current || isVerifying) {
      return undefined;
    }

    const timer = setTimeout(() => {
      void runRegistration();
    }, 400);

    return () => clearTimeout(timer);
  }, [camera.error, camera.isReady, errorMessage, isVerifying, runRegistration]);

  const isBusy = isVerifying || registerMutation.isPending;
  const showCapture = [
    FACE_LIVENESS_PHASE.CAPTURING,
    FACE_LIVENESS_PHASE.COMPLETE,
  ].includes(liveness.phase);

  const progressLabel = (() => {
    if (errorMessage) {
      return null;
    }

    if (showCapture && liveness.challengeLabel) {
      return liveness.challengeLabel;
    }

    if (liveness.phase === FACE_LIVENESS_PHASE.POSITIONING) {
      return liveness.guidance || 'Look directly at the camera';
    }

    if (isBusy) {
      return 'Processing face registration…';
    }

    return 'Camera active';
  })();

  return (
    <FaceAuthLayout
      title="Face Registration"
      subtitle="Keep your eyes open, face the camera, and hold still for about one second"
      footer={
        <button
          type="button"
          onClick={() => router.push(ROUTES.AUTH.LOGIN)}
          disabled={isBusy}
          className={cn(faceAuthBackLinkClass, 'mx-auto flex')}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Login
        </button>
      }
    >
      <div className="relative mx-auto w-fit">
        <PremiumFaceScanner
          videoRef={camera.videoRef}
          isActive
          isReady={camera.isReady}
          isScanning={showCapture || isBusy}
          progress={liveness.progress}
        />

        <p className={faceAuthStatusTextClass} aria-live="polite" aria-atomic="true">
          {progressLabel}
        </p>
      </div>

      {errorMessage ? (
        <FaceAuthRetryActions
          message={errorMessage}
          onRetry={handleRetry}
          disabled={isBusy}
        />
      ) : null}
    </FaceAuthLayout>
  );
}
