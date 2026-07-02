'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { FACE_LIVENESS_PHASE } from '@/features/face/constants/face-liveness-challenges';
import { FaceLoginState } from '@/features/face/types/face-login.types';
import { useFaceLoginFlow } from '@/features/face/hooks/use-face-login-flow';
import { PremiumFaceScanner } from '@/features/face/components/premium-face-scanner';
import {
  faceAuthBackLinkClass,
  FaceAuthLayout,
  FaceAuthRetryActions,
} from '@/features/face/components/face-auth-layout';
import { FaceAuthSimpleStatus } from '@/features/face/components/face-auth-simple-status';
import {
  getFaceLoginSimpleStatus,
  isFaceLoginProcessing,
} from '@/features/face/utils/face-auth-simple-status';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

export function FaceLoginView() {
  const router = useRouter();
  const {
    state,
    bannerError,
    videoRef,
    isCameraReady,
    livenessPhase,
    livenessProgress,
    isScanning,
  } = useFaceLoginFlow();

  const isScanningUi = [
    FACE_LIVENESS_PHASE.CHALLENGE,
    FACE_LIVENESS_PHASE.CAPTURING,
    FACE_LIVENESS_PHASE.COMPLETE,
  ].includes(livenessPhase) || isScanning;

  const statusMessage = bannerError ? null : getFaceLoginSimpleStatus(state);
  const isProcessing = !bannerError && isFaceLoginProcessing(state);

  const handleTryAgain = () => {
    window.location.reload();
  };

  return (
    <FaceAuthLayout
      title="Face Recognition"
      subtitle="Follow the on-screen prompt to verify you are live"
      footer={
        <button
          type="button"
          onClick={() => router.push(ROUTES.AUTH.LOGIN)}
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
      </div>

      {bannerError ? (
        <FaceAuthRetryActions
          message={bannerError}
          onRetry={handleTryAgain}
        />
      ) : (
        <FaceAuthSimpleStatus
          message={statusMessage}
          isLoading={isProcessing && state !== FaceLoginState.SUCCESS}
        />
      )}
    </FaceAuthLayout>
  );
}
