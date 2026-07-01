'use client';



import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useCamera, FACE_LOGIN_VIDEO_CONSTRAINTS } from '@/features/face/hooks/use-camera';

import { useFaceClientLockout } from '@/features/face/hooks/use-face-client-lockout';

import { useFaceLivenessChallenge, FACE_LIVENESS_PHASE } from '@/features/face/hooks/use-face-liveness-challenge';

import { loginWithFaceImage } from '@/features/face/services/faceService';

import { establishSession } from '@/features/auth/utils/establish-session';
import { resolveAuthenticatedLanding } from '@/features/auth/utils/auth-routing';

import { FACE_LOGIN_CAPTURE_SETTINGS } from '@/features/face/constants/face-login-capture-settings';

import {

  FACE_LOGIN_NETWORK_MAX_RETRIES,

  FACE_LOGIN_NETWORK_RETRY_MS,

  FACE_LOGIN_STATUS_LABELS,

  FACE_LOGIN_STATE_PROGRESS,

  FACE_LOGIN_VERIFY_TIMEOUT_MS,

  getFaceLoginErrorMessage,

} from '@/features/face/constants/face-login-messages';

import {
  FACE_LOGIN_CLIENT_LOCK_MS,
  FACE_LOGIN_MAX_CLIENT_FAILURES,
} from '@/features/face/constants/face-liveness-challenges';

import {

  FaceLoginError,

  FaceLoginState,

} from '@/features/face/types/face-login.types';

import type { FaceLoginStatusStep } from '@/features/face/types/face-login.types';

import {
  mapCameraStartError,
} from '@/features/face/utils/face-login-detector';

import { mapFaceLoginApiError } from '@/features/face/utils/map-face-login-api-error';
import { logFaceStep, FaceFlowLog } from '@/features/face/utils/face-flow-log';
import { FaceLoginPerf } from '@/features/face/utils/face-login-perf';
import { waitForCameraReady } from '@/features/face/utils/wait-for-camera-ready';
import {
  FACE_LOGIN_CAMERA_READY_TIMEOUT_MS,
  FACE_LOGIN_FLOW_TIMEOUT_MS,
  FACE_LOGIN_POSITION_TIMEOUT_MS,
} from '@/features/face/constants/face-timeouts';

const LOCKOUT_ELIGIBLE_ERRORS = new Set([
  FaceLoginError.FACE_NOT_RECOGNIZED,
  FaceLoginError.RATE_LIMITED,
]);

const NON_RETRYABLE_ERRORS = new Set([
  FaceLoginError.CAMERA_PERMISSION_DENIED,
  FaceLoginError.CAMERA_NOT_FOUND,
  FaceLoginError.RATE_LIMITED,
]);

const CAPTURE_RETRYABLE_ERRORS = new Set([
  FaceLoginError.TIMEOUT,
  FaceLoginError.CAPTURE_FAILED,
  FaceLoginError.FACE_NOT_DETECTED,
  FaceLoginError.POOR_LIGHTING,
  FaceLoginError.FACE_TOO_FAR,
  FaceLoginError.FACE_TOO_CLOSE,
]);

const MAX_AUTO_RETRIES = 1;
const MAX_SILENT_CAPTURE_RETRIES = 2;



function buildStatusSteps(
  state: FaceLoginState,
  failedError: FaceLoginError | null,
  livenessPhase: string,
): FaceLoginStatusStep[] {
  const failed = state === FaceLoginState.FAILED;

  const cameraComplete = ![
    FaceLoginState.IDLE,
    FaceLoginState.INITIALIZING_CAMERA,
  ].includes(state) && !failed;

  const faceComplete = [
    FaceLoginState.CAPTURING_FACE,
    FaceLoginState.SENDING_REQUEST,
    FaceLoginState.VERIFYING_IDENTITY,
    FaceLoginState.SUCCESS,
  ].includes(state) || livenessPhase === FACE_LIVENESS_PHASE.CAPTURING;

  const livenessComplete = [
    FaceLoginState.SENDING_REQUEST,
    FaceLoginState.VERIFYING_IDENTITY,
    FaceLoginState.SUCCESS,
  ].includes(state) || livenessPhase === FACE_LIVENESS_PHASE.COMPLETE;

  const matchComplete = state === FaceLoginState.SUCCESS;
  const matchActive = [
    FaceLoginState.SENDING_REQUEST,
    FaceLoginState.VERIFYING_IDENTITY,
  ].includes(state);

  const cameraFailed = failed && [
    FaceLoginError.CAMERA_PERMISSION_DENIED,
    FaceLoginError.CAMERA_NOT_FOUND,
    FaceLoginError.CAMERA_UNAVAILABLE,
  ].includes(failedError as FaceLoginError);

  const faceFailed = failed && [
    FaceLoginError.FACE_NOT_DETECTED,
    FaceLoginError.MULTIPLE_FACES,
    FaceLoginError.FACE_TOO_FAR,
    FaceLoginError.FACE_TOO_CLOSE,
    FaceLoginError.POOR_LIGHTING,
  ].includes(failedError as FaceLoginError);

  const livenessFailed = failed && failedError === FaceLoginError.LIVENESS_FAILED;

  const matchFailed = failed && failedError && !cameraFailed && !faceFailed && !livenessFailed;

  return [
    {
      id: 'camera',
      label: FACE_LOGIN_STATUS_LABELS.startingCamera,
      status: cameraFailed
        ? 'error'
        : cameraComplete
          ? 'complete'
          : state === FaceLoginState.INITIALIZING_CAMERA
            ? 'active'
            : 'pending',
    },
    {
      id: 'face',
      label: FACE_LOGIN_STATUS_LABELS.detectingFace,
      status: faceFailed
        ? 'error'
        : faceComplete
          ? 'complete'
          : state === FaceLoginState.DETECTING_FACE
            ? 'active'
            : 'pending',
    },
    {
      id: 'liveness',
      label: FACE_LOGIN_STATUS_LABELS.verifyingLiveness,
      status: livenessFailed
        ? 'error'
        : livenessComplete
          ? 'complete'
          : state === FaceLoginState.CAPTURING_FACE
            || livenessPhase === FACE_LIVENESS_PHASE.CAPTURING
            ? 'active'
            : 'pending',
    },
    {
      id: 'match',
      label: FACE_LOGIN_STATUS_LABELS.matchingIdentity,
      status: matchFailed
        ? 'error'
        : matchComplete
          ? 'complete'
          : matchActive
            ? 'active'
            : 'pending',
    },
    {
      id: 'signin',
      label: FACE_LOGIN_STATUS_LABELS.signingIn,
      status: matchComplete
        ? 'complete'
        : state === FaceLoginState.SUCCESS
          ? 'active'
          : 'pending',
    },
  ];
}



export function useFaceLoginFlow() {

  const router = useRouter();
  const searchParams = useSearchParams();

  const camera = useCamera({
    videoConstraints: FACE_LOGIN_VIDEO_CONSTRAINTS,
    captureMaxWidth: FACE_LOGIN_CAPTURE_SETTINGS.captureMaxWidth,
    captureQuality: FACE_LOGIN_CAPTURE_SETTINGS.captureQuality,
  });

  const clientLockout = useFaceClientLockout(

    FACE_LOGIN_MAX_CLIENT_FAILURES,

    FACE_LOGIN_CLIENT_LOCK_MS,

  );



  const [state, setState] = useState<FaceLoginState>(FaceLoginState.IDLE);

  const [fatalError, setFatalError] = useState<FaceLoginError | null>(null);

  const [detectionHint, setDetectionHint] = useState<FaceLoginError | null>(null);



  const detectorRef = useRef(null);

  const abortRef = useRef<AbortController | null>(null);

  const verifyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mountedRef = useRef(true);

  const flowGenerationRef = useRef(0);

  const networkRetryRef = useRef(0);

  const flowStartedRef = useRef(false);
  const consecutiveFailuresRef = useRef(0);
  const captureAndVerifyRef = useRef<((generation: number) => Promise<void>) | null>(null);
  const activeGenerationRef = useRef(0);

  const flowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loginSucceededRef = useRef(false);

  const submitInFlightRef = useRef(false);

  const isColdStartRef = useRef(true);

  const captureRetryCountRef = useRef(0);

  const warmupPromiseRef = useRef<Promise<void> | null>(null);

  const isFlowCancelled = useCallback(
    (generation: number) => generation !== flowGenerationRef.current || !mountedRef.current,
    [],
  );

  const liveness = useFaceLivenessChallenge({
    camera,
    detectorRef,
    positionTimeoutMs: FACE_LOGIN_POSITION_TIMEOUT_MS,
    analyzeTimeoutMs: 250,
    positionStableMs: FACE_LOGIN_CAPTURE_SETTINGS.positionStableMs,
    stableFrameCount: FACE_LOGIN_CAPTURE_SETTINGS.stableFrameCount,
    maxFrames: FACE_LOGIN_CAPTURE_SETTINGS.maxFrames,
    minFrames: FACE_LOGIN_CAPTURE_SETTINGS.minFrames,
    captureIntervalMs: FACE_LOGIN_CAPTURE_SETTINGS.captureIntervalMs,
    detectionIntervalMs: FACE_LOGIN_CAPTURE_SETTINGS.detectionIntervalMs,
    captureWarmupMs: FACE_LOGIN_CAPTURE_SETTINGS.captureWarmupMs,
    burstCapture: true,
    skipPositioning: true,
    skipSharpnessSort: true,
    isCancelled: () => isFlowCancelled(activeGenerationRef.current),
  });

  const clearTimers = useCallback(() => {

    if (verifyTimeoutRef.current) {

      clearTimeout(verifyTimeoutRef.current);

      verifyTimeoutRef.current = null;

    }

    if (flowTimeoutRef.current) {

      clearTimeout(flowTimeoutRef.current);

      flowTimeoutRef.current = null;

    }

  }, []);



  const abortRequest = useCallback(() => {

    abortRef.current?.abort();

    abortRef.current = null;

  }, []);



  const fail = useCallback((error: FaceLoginError, generation?: number) => {
    if (loginSucceededRef.current) {
      return;
    }

    if (generation != null && isFlowCancelled(generation)) {
      return;
    }

    if (!mountedRef.current) {
      return;
    }

    if (
      captureRetryCountRef.current < MAX_SILENT_CAPTURE_RETRIES
      && CAPTURE_RETRYABLE_ERRORS.has(error)
      && !submitInFlightRef.current
    ) {
      captureRetryCountRef.current += 1;
      flowStartedRef.current = false;
      clearTimers();
      abortRequest();
      setFatalError(null);
      setDetectionHint(null);
      setState(FaceLoginState.DETECTING_FACE);
      logFaceStep('silent-capture-retry', error);
      void captureAndVerifyRef.current?.(generation ?? flowGenerationRef.current);
      return;
    }

    if (
      consecutiveFailuresRef.current < MAX_AUTO_RETRIES
      && !NON_RETRYABLE_ERRORS.has(error)
      && !submitInFlightRef.current
    ) {
      consecutiveFailuresRef.current += 1;
      flowStartedRef.current = false;
      clearTimers();
      abortRequest();
      setFatalError(null);
      setDetectionHint(error);
      setState(FaceLoginState.DETECTING_FACE);
      logFaceStep('auto-retry', error);
      void captureAndVerifyRef.current?.(generation ?? flowGenerationRef.current);
      return;
    }

    consecutiveFailuresRef.current = 0;
    captureRetryCountRef.current = 0;
    clearTimers();

    abortRequest();

    setFatalError(error);

    setDetectionHint(null);

    setState(FaceLoginState.FAILED);

    logFaceStep('fail', error);

    if (LOCKOUT_ELIGIBLE_ERRORS.has(error)) {

      clientLockout.recordFailure();

    }

  }, [abortRequest, clearTimers, clientLockout, isFlowCancelled]);

  const armFlowTimeout = useCallback((generation: number) => {
    if (flowTimeoutRef.current) {
      clearTimeout(flowTimeoutRef.current);
      flowTimeoutRef.current = null;
    }

    flowTimeoutRef.current = setTimeout(() => {
      if (isFlowCancelled(generation)) return;

      abortRequest();
      fail(FaceLoginError.TIMEOUT, generation);
    }, FACE_LOGIN_FLOW_TIMEOUT_MS);
  }, [abortRequest, fail, isFlowCancelled]);

  const ensureWarmResources = useCallback(async (generation: number) => {
    if (!warmupPromiseRef.current) {
      warmupPromiseRef.current = (
        camera.isReady ? Promise.resolve({ ok: true }) : camera.start()
      ).then(() => undefined);
    }

    await warmupPromiseRef.current;

    if (isFlowCancelled(generation)) {
      return false;
    }

    const cameraReady = camera.isReady || (await waitForCameraReady(camera.videoRef, {
      timeoutMs: 4_000,
      pollMs: 50,
      isCancelled: () => isFlowCancelled(generation),
    }));

    if (!cameraReady || isFlowCancelled(generation)) {
      return false;
    }

    isColdStartRef.current = false;
    return true;
  }, [camera, isFlowCancelled]);



  const submitLogin = useCallback(async (securePayload: {

    frames: File[];

    challengeType: string;

    captureSessionId: string;

    primaryFrame: File;

  }, generation: number) => {

    if (loginSucceededRef.current || submitInFlightRef.current) {
      return;
    }

    submitInFlightRef.current = true;

    setState(FaceLoginState.SENDING_REQUEST);

    setDetectionHint(null);

    FaceLoginPerf.mark('api_start');
    logFaceStep(6, 'API request started');

    if (flowTimeoutRef.current) {

      clearTimeout(flowTimeoutRef.current);

      flowTimeoutRef.current = null;

    }

    abortRequest();

    const controller = new AbortController();

    abortRef.current = controller;



    verifyTimeoutRef.current = setTimeout(() => {
      if (isFlowCancelled(generation)) return;

      controller.abort();
      fail(FaceLoginError.TIMEOUT, generation);
    }, FACE_LOGIN_VERIFY_TIMEOUT_MS);



    try {

      setState(FaceLoginState.VERIFYING_IDENTITY);



      const data = await loginWithFaceImage(null, {

        signal: controller.signal,

        securePayload,

      });



      if (generation !== flowGenerationRef.current || !mountedRef.current) {

        return;

      }



      loginSucceededRef.current = true;
      isColdStartRef.current = false;
      captureRetryCountRef.current = 0;

      clearTimers();

      flowGenerationRef.current += 1;

      abortRequest();



      establishSession({

        accessToken: data.accessToken,

        refreshToken: data.refreshToken,

        user: data.user,

      });

      consecutiveFailuresRef.current = 0;
      FaceFlowLog.loginSuccess();
      if (data?.similarityScore != null) {
        FaceFlowLog.matchingScore(data.similarityScore);
      }



      clientLockout.recordSuccess();
      setState(FaceLoginState.SUCCESS);

      FaceLoginPerf.mark('api_complete');
      FaceLoginPerf.mark('login_complete');
      FaceLoginPerf.report();

      camera.stop();
      router.replace(
        resolveAuthenticatedLanding(data?.user, {
          redirect: searchParams.get('redirect'),
        }),
      );

    } catch (err) {

      if (generation !== flowGenerationRef.current || !mountedRef.current) {

        return;

      }



      if ((err as Error)?.name === 'AbortError') {

        return;

      }



      const mapped = mapFaceLoginApiError(err);



      if (

        mapped === FaceLoginError.NETWORK_ERROR

        && networkRetryRef.current < FACE_LOGIN_NETWORK_MAX_RETRIES

      ) {

        networkRetryRef.current += 1;

        setState(FaceLoginState.SENDING_REQUEST);

        await new Promise((resolve) => {

          setTimeout(resolve, FACE_LOGIN_NETWORK_RETRY_MS);

        });

        if (generation === flowGenerationRef.current && mountedRef.current) {

          await submitLogin(securePayload, generation);

        }

        return;

      }



      fail(mapped, generation);

    } finally {

      submitInFlightRef.current = false;

      if (verifyTimeoutRef.current) {

        clearTimeout(verifyTimeoutRef.current);

        verifyTimeoutRef.current = null;

      }

    }

  }, [abortRequest, camera, clientLockout, fail, isFlowCancelled, router, searchParams]);



  const captureAndVerify = useCallback(async (generation: number) => {
    if (flowStartedRef.current) {
      return;
    }

    flowStartedRef.current = true;
    activeGenerationRef.current = generation;
    FaceLoginPerf.reset();
    FaceLoginPerf.mark('liveness_start');
    setState(FaceLoginState.CAPTURING_FACE);
    setDetectionHint(null);
    liveness.reset();
    logFaceStep(2, 'liveness flow started');

    try {
      clientLockout.assertUnlocked();

      const securePayload = await liveness.runLivenessFlow();
      FaceLoginPerf.mark('liveness_complete');
      logFaceStep(3, 'liveness complete');

      if (isFlowCancelled(generation)) {
        return;
      }

      if (!securePayload?.frames?.length) {
        fail(FaceLoginError.CAPTURE_FAILED, generation);
        return;
      }

      clearTimers();

      await submitLogin(securePayload, generation);
    } catch (err) {
      if (isFlowCancelled(generation)) {
        return;
      }

      if ((err as Error)?.message?.includes('Too many failed attempts')) {
        fail(FaceLoginError.RATE_LIMITED, generation);
        return;
      }

      const message = String((err as Error)?.message || '').toLowerCase();

      if (message.includes('face positioning timed out') || message.includes("couldn't capture a clear face")) {
        fail(FaceLoginError.TIMEOUT, generation);
        return;
      }

      if (message.includes('hold still')) {
        fail(FaceLoginError.CAPTURE_FAILED, generation);
        return;
      }

      if (message.includes('timed out')) {
        fail(FaceLoginError.TIMEOUT, generation);
        return;
      }

      fail(FaceLoginError.CAPTURE_FAILED, generation);
    } finally {
      if (activeGenerationRef.current === generation) {
        flowStartedRef.current = false;
      }
    }
  }, [clientLockout, fail, isFlowCancelled, liveness, submitLogin]);

  captureAndVerifyRef.current = captureAndVerify;



  const bootCamera = useCallback(async (generation: number) => {

    setFatalError(null);

    setDetectionHint(null);

    setState(FaceLoginState.INITIALIZING_CAMERA);



    try {

      clientLockout.assertUnlocked();

      const warmed = await ensureWarmResources(generation);

      if (isFlowCancelled(generation)) {
        return;
      }

      if (!warmed) {
        const startResult = await camera.start();
        if (!startResult?.ok) {
          fail(mapCameraStartError({ message: startResult?.error }), generation);
          return;
        }

        const cameraReady = await waitForCameraReady(camera.videoRef, {
          timeoutMs: FACE_LOGIN_CAMERA_READY_TIMEOUT_MS,
          isCancelled: () => isFlowCancelled(generation),
        });

        if (!cameraReady) {
          fail(FaceLoginError.CAMERA_UNAVAILABLE, generation);
          return;
        }
      }

      logFaceStep(1, 'camera stream opened');

      FaceLoginPerf.mark('camera_ready');

      setState(FaceLoginState.CAMERA_READY);
      logFaceStep(1, 'camera ready');
      FaceFlowLog.cameraReady();

      armFlowTimeout(generation);

      setState(FaceLoginState.DETECTING_FACE);
      await captureAndVerify(generation);
    } catch (err) {
      if (isFlowCancelled(generation)) {
        return;
      }

      if ((err as Error)?.message?.includes('Too many failed attempts')) {
        fail(FaceLoginError.RATE_LIMITED, generation);
        return;
      }

      fail(mapCameraStartError(err), generation);
    }
  }, [armFlowTimeout, camera, captureAndVerify, clientLockout, ensureWarmResources, fail, isFlowCancelled]);



  const startFlow = useCallback(async () => {
    flowGenerationRef.current += 1;
    const generation = flowGenerationRef.current;
    activeGenerationRef.current = generation;

    networkRetryRef.current = 0;
    flowStartedRef.current = false;
    consecutiveFailuresRef.current = 0;
    loginSucceededRef.current = false;
    submitInFlightRef.current = false;
    isColdStartRef.current = true;
    captureRetryCountRef.current = 0;

    clearTimers();
    abortRequest();

    setFatalError(null);
    setDetectionHint(null);
    liveness.reset();
    FaceLoginPerf.mark('flow_start');
    logFaceStep(0, 'flow started');

    if (!warmupPromiseRef.current) {
      warmupPromiseRef.current = (
        camera.isReady ? Promise.resolve({ ok: true }) : camera.start()
      ).then(() => undefined);
    }

    await bootCamera(generation);
  }, [abortRequest, bootCamera, camera.isReady, clearTimers, liveness]);



  const retry = useCallback(() => {

    if (clientLockout.isLocked) {

      return;

    }

    camera.stop();
    warmupPromiseRef.current = null;
    isColdStartRef.current = false;

    void startFlow();

  }, [camera, clientLockout.isLocked, startFlow]);



  useEffect(() => {

    mountedRef.current = true;

    void startFlow();



    return () => {

      mountedRef.current = false;

      flowGenerationRef.current += 1;

      clearTimers();

      abortRequest();

      warmupPromiseRef.current = null;

      camera.stop();

    };

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);



  const statusSteps = useMemo(

    () => buildStatusSteps(state, fatalError, liveness.phase),

    [fatalError, liveness.phase, state],

  );



  const overlayMessage = (() => {

    if (state === FaceLoginState.VERIFYING_IDENTITY) {

      return 'Matching…';

    }

    if (state === FaceLoginState.SUCCESS) {

      return 'Face Verified';

    }

    return FACE_LOGIN_STATE_PROGRESS[state] ?? 'Working…';

  })();



  const showOverlay = [

    FaceLoginState.CAPTURING_FACE,

    FaceLoginState.SENDING_REQUEST,

    FaceLoginState.VERIFYING_IDENTITY,

    FaceLoginState.SUCCESS,

  ].includes(state) || liveness.phase === FACE_LIVENESS_PHASE.COMPLETE;



  const bannerError = fatalError

    ? getFaceLoginErrorMessage(fatalError)

    : detectionHint

      ? getFaceLoginErrorMessage(detectionHint)

      : clientLockout.isLocked

        ? getFaceLoginErrorMessage(FaceLoginError.RATE_LIMITED)

        : null;



  const canRetry = state === FaceLoginState.FAILED

    || Boolean(bannerError && state !== FaceLoginState.SUCCESS);



  const isBusy = [

    FaceLoginState.SENDING_REQUEST,

    FaceLoginState.VERIFYING_IDENTITY,

  ].includes(state);



  const isBlockingNavigation = isBusy;

  const isScanning = [

    FaceLoginState.CAPTURING_FACE,

    FaceLoginState.SENDING_REQUEST,

    FaceLoginState.VERIFYING_IDENTITY,

  ].includes(state) || [
    FACE_LIVENESS_PHASE.CAPTURING,
  ].includes(liveness.phase);



  const progressLabel = (() => {

    if (liveness.phase === FACE_LIVENESS_PHASE.POSITIONING) {
      return FACE_LOGIN_STATUS_LABELS.detectingFace;
    }

    if (liveness.phase === FACE_LIVENESS_PHASE.CAPTURING) {
      return FACE_LOGIN_STATUS_LABELS.verifyingLiveness;
    }

    if (liveness.phase === FACE_LIVENESS_PHASE.COMPLETE) {
      return FACE_LOGIN_STATUS_LABELS.verifyingLiveness;
    }

    if (state === FaceLoginState.SENDING_REQUEST || state === FaceLoginState.VERIFYING_IDENTITY) {
      return FACE_LOGIN_STATUS_LABELS.matchingIdentity;
    }

    if (state === FaceLoginState.SUCCESS) {
      return FACE_LOGIN_STATUS_LABELS.signingIn;
    }

    if (state === FaceLoginState.FAILED) {
      return null;
    }

    return liveness.guidance || FACE_LOGIN_STATE_PROGRESS[state] || 'Preparing face sign-in…';

  })();



  return {

    state,

    fatalError,

    detectionHint,

    statusSteps,

    bannerError,

    overlayMessage,

    showOverlay,

    canRetry,

    isBusy,

    isBlockingNavigation,

    isScanning,

    retry,

    videoRef: camera.videoRef,

    isCameraReady: camera.isReady,

    cameraError: camera.error,

    livenessPhase: liveness.phase,

    livenessProgress: liveness.progress,

    livenessGuidance: liveness.guidance,

    livenessChallengeLabel: liveness.challenge?.label || null,

    progressLabel,

  };

}


