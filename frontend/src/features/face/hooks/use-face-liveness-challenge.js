'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FACE_CAPTURE_TIMEOUT_MESSAGE,
  FACE_LIVENESS_CAPTURE_INTERVAL_MS,
  FACE_LIVENESS_CHALLENGE,
  FACE_LIVENESS_DETECTION_INTERVAL_MS,
  FACE_LIVENESS_INSTRUCTION_PAUSE_MS,
  FACE_LIVENESS_MAX_FRAMES,
  FACE_LIVENESS_MIN_FRAMES,
  FACE_LIVENESS_PHASE,
  FACE_LIVENESS_POSITION_STABLE_MS,
  FACE_LIVENESS_STABLE_FRAME_COUNT,
  getLivenessGuidanceMessage,
} from '@/features/face/constants/face-liveness-challenges';
import { FACE_CAPTURE_WARMUP_MS, FACE_LIVENESS_POSITION_TIMEOUT_MS } from '@/features/face/constants/face-timeouts';
import { FaceLoginDetector } from '@/features/face/utils/face-login-detector';
import { FaceFlowLog } from '@/features/face/utils/face-flow-log';
import { FaceLoginPerf } from '@/features/face/utils/face-login-perf';
import { measureFrameSharpness } from '@/features/face/utils/prepare-face-image';

export { FACE_LIVENESS_PHASE };

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function nextDetectionDelay(intervalMs) {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      const startedAt = performance.now();
      const tick = (now) => {
        if (now - startedAt >= intervalMs) {
          resolve(undefined);
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return;
    }
    setTimeout(resolve, intervalMs);
  });
}

export function useFaceLivenessChallenge({
  camera,
  detectorRef,
  challenge: challengeOverride,
  positionTimeoutMs = FACE_LIVENESS_POSITION_TIMEOUT_MS,
  analyzeTimeoutMs = 4_000,
  positionStableMs = FACE_LIVENESS_POSITION_STABLE_MS,
  stableFrameCount = FACE_LIVENESS_STABLE_FRAME_COUNT,
  maxFrames = FACE_LIVENESS_MAX_FRAMES,
  minFrames = FACE_LIVENESS_MIN_FRAMES,
  captureIntervalMs = FACE_LIVENESS_CAPTURE_INTERVAL_MS,
  detectionIntervalMs = FACE_LIVENESS_DETECTION_INTERVAL_MS,
  getPositionTimeoutMs,
  getAnalyzeTimeoutMs,
  skipPositioning = false,
  burstCapture = false,
  captureWarmupMs = FACE_CAPTURE_WARMUP_MS,
  skipSharpnessSort = false,
  skipChallengePhase = false,
  instructionPauseMs = FACE_LIVENESS_INSTRUCTION_PAUSE_MS,
  isCancelled = () => false,
}) {
  const [phase, setPhase] = useState(FACE_LIVENESS_PHASE.POSITIONING);
  const challenge = useMemo(
    () => challengeOverride || FACE_LIVENESS_CHALLENGE,
    [challengeOverride],
  );
  const [guidance, setGuidance] = useState('Look directly at the camera');
  const [progress, setProgress] = useState(0);
  const [captureSessionId] = useState(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `face-${Date.now()}`;
  });

  const stableSinceRef = useRef(null);
  const stableFrameCountRef = useRef(0);
  const capturedFramesRef = useRef([]);

  const reset = useCallback(() => {
    stableSinceRef.current = null;
    stableFrameCountRef.current = 0;
    capturedFramesRef.current = [];
    setProgress(0);
    setGuidance('Look directly at the camera');
    setPhase(FACE_LIVENESS_PHASE.POSITIONING);
  }, []);

  const waitForStableFace = useCallback(async () => {
    const detector = detectorRef.current || new FaceLoginDetector();
    if (!detectorRef.current) {
      await detector.init();
      detectorRef.current = detector;
    }

    stableSinceRef.current = null;
    stableFrameCountRef.current = 0;
    const positioningStartedAt = Date.now();
    const effectivePositionTimeout = typeof getPositionTimeoutMs === 'function'
      ? getPositionTimeoutMs()
      : positionTimeoutMs;

    while (!isCancelled()) {
      if (Date.now() - positioningStartedAt >= effectivePositionTimeout) {
        throw new Error(FACE_CAPTURE_TIMEOUT_MESSAGE);
      }

      const video = camera.videoRef.current;
      if (!video || !camera.isReady) {
        await sleep(100);
        continue;
      }

      const effectiveAnalyzeTimeout = typeof getAnalyzeTimeoutMs === 'function'
        ? getAnalyzeTimeoutMs()
        : analyzeTimeoutMs;

      const result = await detector.analyze(video, effectiveAnalyzeTimeout);

      if (isCancelled()) {
        return false;
      }

      if (result.issue) {
        stableSinceRef.current = null;
        stableFrameCountRef.current = 0;
        setGuidance(getLivenessGuidanceMessage(result.issue) || 'Move your face inside the camera frame.');
        await nextDetectionDelay(detectionIntervalMs);
        continue;
      }

      if (!result.ready) {
        stableSinceRef.current = null;
        stableFrameCountRef.current = 0;
        setGuidance('Move your face inside the camera frame.');
        await nextDetectionDelay(detectionIntervalMs);
        continue;
      }

      FaceFlowLog.faceDetected(result.faceCount || 1);
      stableFrameCountRef.current += 1;

      const now = Date.now();
      if (!stableSinceRef.current) {
        stableSinceRef.current = now;
        setGuidance('Hold still with your eyes open…');
      }

      const stableDuration = now - stableSinceRef.current;
      const stableFramesReached = stableFrameCountRef.current >= stableFrameCount;
      const stableTimeReached = stableDuration >= positionStableMs;

      if (stableFramesReached && stableTimeReached) {
        FaceFlowLog.stableFrameDetected(stableFrameCountRef.current);
        FaceFlowLog.qualityPassed();
        return true;
      }

      await nextDetectionDelay(detectionIntervalMs);
    }

    return false;
  }, [
    analyzeTimeoutMs,
    camera.isReady,
    camera.videoRef,
    detectionIntervalMs,
    detectorRef,
    getAnalyzeTimeoutMs,
    getPositionTimeoutMs,
    isCancelled,
    positionStableMs,
    positionTimeoutMs,
    stableFrameCount,
  ]);

  const captureStableFrames = useCallback(async () => {
    const video = camera.videoRef.current;
    if (!video) {
      return [];
    }

    const targetFrames = maxFrames;

    if (burstCapture) {
      const batch = await Promise.all(
        Array.from({ length: targetFrames }, () => camera.captureFrame()),
      );
      const frames = batch.filter(Boolean);
      setProgress(100);
      return frames;
    }

    const captured = [];

    while (!isCancelled() && captured.length < targetFrames) {
      const frame = await camera.captureFrame();
      if (frame) {
        if (skipSharpnessSort) {
          captured.push(frame);
        } else {
          captured.push({
            file: frame,
            sharpness: measureFrameSharpness(video),
          });
        }
      }

      setProgress(Math.min(100, Math.round((captured.length / targetFrames) * 100)));
      if (captured.length >= targetFrames) {
        break;
      }

      if (captureIntervalMs > 0) {
        await sleep(captureIntervalMs);
      } else if (captured.length < targetFrames) {
        await nextDetectionDelay(32);
      }
    }

    if (skipSharpnessSort) {
      return captured;
    }

    captured.sort((left, right) => right.sharpness - left.sharpness);
    return captured.map((entry) => entry.file);
  }, [burstCapture, camera, captureIntervalMs, isCancelled, maxFrames, skipSharpnessSort]);

  const runLivenessFlow = useCallback(async () => {
    capturedFramesRef.current = [];
    setProgress(0);

    if (isCancelled()) {
      return null;
    }

    const shouldSkipPositioning = typeof skipPositioning === 'function'
      ? skipPositioning()
      : skipPositioning;

    if (!shouldSkipPositioning) {
      FaceLoginPerf.mark('positioning_start');
      setPhase(FACE_LIVENESS_PHASE.POSITIONING);
      const positioned = await waitForStableFace();
      FaceLoginPerf.mark('positioning_complete');
      if (!positioned || isCancelled()) {
        return null;
      }
    }

    if (isCancelled()) {
      return null;
    }

    if (!skipChallengePhase) {
      setPhase(FACE_LIVENESS_PHASE.CHALLENGE);
      setGuidance(challenge.instruction);
      if (instructionPauseMs > 0) {
        await sleep(instructionPauseMs);
      }

      if (isCancelled()) {
        return null;
      }
    }

    setPhase(FACE_LIVENESS_PHASE.CAPTURING);
    setGuidance(challenge.instruction);

    if (!burstCapture && captureWarmupMs > 0) {
      await sleep(captureWarmupMs);
    }

    FaceLoginPerf.mark('capture_start');
    const frames = await captureStableFrames();
    FaceLoginPerf.mark('capture_complete');

    if (isCancelled()) {
      return null;
    }

    if (frames.length < minFrames) {
      throw new Error(challenge.instruction || 'Hold still for a second while we capture your face.');
    }

    capturedFramesRef.current = frames;
    setPhase(FACE_LIVENESS_PHASE.COMPLETE);
    setProgress(100);
    setGuidance('Processing secure face scan…');
    FaceFlowLog.livenessPassed(challenge.id);
    FaceFlowLog.embeddingGenerated();

    return {
      challengeType: challenge.id,
      captureSessionId,
      frames,
      primaryFrame: frames[0],
    };
  }, [
    burstCapture,
    captureStableFrames,
    captureSessionId,
    captureWarmupMs,
    challenge.id,
    challenge.instruction,
    instructionPauseMs,
    isCancelled,
    minFrames,
    skipChallengePhase,
    skipPositioning,
    waitForStableFace,
  ]);

  const challengeLabel = useMemo(
    () => guidance || challenge.instruction,
    [challenge.instruction, guidance],
  );

  return {
    phase,
    challenge,
    challengeLabel,
    guidance,
    progress,
    captureSessionId,
    reset,
    runLivenessFlow,
    getChallengeById: () => challenge,
  };
}
