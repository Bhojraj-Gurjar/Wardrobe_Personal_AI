'use client';

import { useEffect, useRef, useState } from 'react';
import { getLivenessGuidanceMessage } from '@/features/face/constants/face-liveness-challenges';
import { FaceLoginDetector } from '@/features/face/utils/face-login-detector';
import { measureFrameSharpness } from '@/features/face/utils/prepare-face-image';

const MIN_SHARPNESS = 18;
const DETECTION_INTERVAL_MS = 120;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useFaceCaptureGuidance({ videoRef, enabled = false, isReady = false }) {
  const detectorRef = useRef(null);
  const [guidance, setGuidance] = useState('Opening camera…');
  const [faceReady, setFaceReady] = useState(false);
  const [status, setStatus] = useState('initializing');

  useEffect(() => {
    if (!enabled) {
      setGuidance('Opening camera…');
      setFaceReady(false);
      setStatus('initializing');
      return undefined;
    }

    if (!isReady) {
      setGuidance('Opening camera…');
      setFaceReady(false);
      setStatus('initializing');
      return undefined;
    }

    let cancelled = false;

    const runLoop = async () => {
      while (!cancelled) {
        const video = videoRef.current;

        if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
          setStatus('initializing');
          setGuidance('Opening camera…');
          setFaceReady(false);
          await sleep(DETECTION_INTERVAL_MS);
          continue;
        }

        if (!detectorRef.current) {
          detectorRef.current = new FaceLoginDetector();
          await detectorRef.current.init();
          await detectorRef.current.warmUp(video);
        }

        setStatus('detecting');

        const result = await detectorRef.current.analyze(video, 2_500);

        if (cancelled) {
          return;
        }

        if (result.issue) {
          setFaceReady(false);
          setGuidance(getLivenessGuidanceMessage(result.issue));
          await sleep(DETECTION_INTERVAL_MS);
          continue;
        }

        const sharpness = measureFrameSharpness(video);

        if (sharpness < MIN_SHARPNESS) {
          setFaceReady(false);
          setGuidance('Hold still — image is blurry. Improve lighting or focus.');
          await sleep(DETECTION_INTERVAL_MS);
          continue;
        }

        setFaceReady(true);
        setGuidance('Face detected. Hold still, then capture.');
        setStatus('ready');
        await sleep(DETECTION_INTERVAL_MS);
      }
    };

    void runLoop();

    return () => {
      cancelled = true;
      detectorRef.current?.destroy();
      detectorRef.current = null;
    };
  }, [enabled, isReady, videoRef]);

  return { guidance, faceReady, status };
}
