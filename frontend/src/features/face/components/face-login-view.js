'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { FACE_LIVENESS_PHASE } from '@/features/face/constants/face-liveness-challenges';
import { useFaceLoginFlow } from '@/features/face/hooks/use-face-login-flow';
import { AuthenticationStatus } from '@/features/face/components/authentication-status';
import { PremiumFaceScanner } from '@/features/face/components/premium-face-scanner';
import { faceAuthStatusTextClass, FaceAuthLayout, FaceAuthRetryActions, faceAuthBackLinkClass } from '@/features/face/components/face-auth-layout';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

export function FaceLoginView() {
  const router = useRouter();
  const {
    bannerError,
    canRetry,
    retry,
    videoRef,
    isCameraReady,
    livenessPhase,
    livenessProgress,
    isBusy,
    isBlockingNavigation,
    isScanning,
    progressLabel,
    statusSteps,
  } = useFaceLoginFlow();

  const isScanningUi = [
    FACE_LIVENESS_PHASE.CHALLENGE,
    FACE_LIVENESS_PHASE.CAPTURING,
    FACE_LIVENESS_PHASE.COMPLETE,
  ].includes(livenessPhase) || isScanning;

  return (
    <FaceAuthLayout
      title="Face Recognition"
      subtitle="Follow the on-screen prompt to verify you are live"
      footer={
        <button
          type="button"
          onClick={() => router.push(ROUTES.AUTH.LOGIN)}
          disabled={isBlockingNavigation}
          className={cn(faceAuthBackLinkClass, 'mx-auto flex')}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Login
        </button>
      }
    >
      <div className="relative mx-auto w-fit">
        <PremiumFaceScanner
          videoRef={videoRef}
          isActive
          isReady={isCameraReady}
          isScanning={isScanningUi}
          progress={livenessProgress}
        />

        {bannerError || progressLabel || isBusy ? (
          <p className={faceAuthStatusTextClass} aria-live="polite" aria-atomic="true">
            {bannerError ? null : (progressLabel || (isBusy ? 'Processing…' : null))}
          </p>
        ) : null}
      </div>

      {!bannerError ? (
        <AuthenticationStatus steps={statusSteps} className="mx-auto max-w-sm" />
      ) : null}

      {bannerError ? (
        <FaceAuthRetryActions
          message={bannerError}
          onRetry={canRetry ? retry : undefined}
          disabled={isBusy}
        />
      ) : null}
    </FaceAuthLayout>
  );
}
