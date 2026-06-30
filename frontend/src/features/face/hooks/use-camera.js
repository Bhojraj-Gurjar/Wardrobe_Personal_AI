'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { captureCompressedFaceBlob, FACE_IMAGE_JPEG_QUALITY, FACE_IMAGE_MAX_WIDTH } from '@/features/face/utils/prepare-face-image';
import { logFaceStep } from '@/features/face/utils/face-flow-log';
import { mapCameraStartError } from '@/features/face/utils/face-login-detector';
import { FaceLoginError } from '@/features/face/types/face-login.types';

/** Lower resolution for faster webcam cold-start (face login). */
export const FACE_LOGIN_VIDEO_CONSTRAINTS = {
  facingMode: 'user',
  width: { ideal: 640, max: 640 },
  height: { ideal: 480, max: 480 },
  focusMode: { ideal: 'continuous' },
  exposureMode: { ideal: 'continuous' },
  whiteBalanceMode: { ideal: 'continuous' },
};

const DEFAULT_VIDEO_CONSTRAINTS = {
  facingMode: 'user',
  width: { ideal: 1280 },
  height: { ideal: 720 },
  focusMode: { ideal: 'continuous' },
  exposureMode: { ideal: 'continuous' },
  whiteBalanceMode: { ideal: 'continuous' },
};

const CAMERA_ERROR_MESSAGES = {
  [FaceLoginError.CAMERA_PERMISSION_DENIED]: 'Camera permission denied. Allow access in browser settings or upload an image.',
  [FaceLoginError.CAMERA_NOT_FOUND]: 'No camera found on this device.',
  [FaceLoginError.CAMERA_UNAVAILABLE]: 'Camera is unavailable. Close other apps using the camera and try again.',
};

function isBenignPlayError(err) {
  if (!err) return false;
  if (err.name === 'AbortError') return true;
  const message = String(err.message || '');
  return (
    message.includes('interrupted by a new load request') ||
    message.includes('play() request was interrupted')
  );
}

function waitForVideoReady(video) {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const onReady = () => {
      video.removeEventListener('loadedmetadata', onReady);
      resolve();
    };
    video.addEventListener('loadedmetadata', onReady);
  });
}

async function waitForVideoElement(videoRef, maxAttempts = 60) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (videoRef.current) {
      return videoRef.current;
    }

    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  return null;
}

async function waitForVideoDimensions(video, maxAttempts = 45) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      return true;
    }

    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  return false;
}

function buildVideoConstraints(baseConstraints, deviceId) {
  if (!deviceId) {
    return baseConstraints;
  }

  const { facingMode, ...rest } = baseConstraints;
  return {
    ...rest,
    deviceId: { exact: deviceId },
  };
}

export function useCamera(options = {}) {
  const videoConstraints = options.videoConstraints ?? DEFAULT_VIDEO_CONSTRAINTS;
  const captureMaxWidth = options.captureMaxWidth ?? FACE_IMAGE_MAX_WIDTH;
  const captureQuality = options.captureQuality ?? FACE_IMAGE_JPEG_QUALITY;
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const startGenerationRef = useRef(0);
  const trackEndedHandlerRef = useRef(null);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [devices, setDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState(null);

  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
    }

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const stop = useCallback(() => {
    startGenerationRef.current += 1;
    releaseStream();
    setIsReady(false);
    setIsActive(false);
  }, [releaseStream]);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return [];
    }

    const all = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = all.filter((device) => device.kind === 'videoinput');
    setDevices(videoInputs);
    return videoInputs;
  }, []);

  const start = useCallback(async (startOptions = {}) => {
    const generation = startGenerationRef.current + 1;
    startGenerationRef.current = generation;
    setError(null);

    const requestedDeviceId = startOptions.deviceId ?? activeDeviceId;
    const forceRestart = startOptions.forceRestart !== false;

    if (
      !forceRestart
      && streamRef.current
      && videoRef.current?.srcObject === streamRef.current
      && !videoRef.current?.paused
      && videoRef.current?.videoWidth > 0
    ) {
      setIsReady(true);
      setIsActive(true);
      return { ok: true };
    }

    try {
      releaseStream();

      if (!navigator.mediaDevices?.getUserMedia) {
        const message = 'Camera is not supported in this browser.';
        setError(message);
        return { ok: false, error: message };
      }

      const constraints = buildVideoConstraints(videoConstraints, requestedDeviceId);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: constraints,
        audio: false,
      });

      if (generation !== startGenerationRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return { ok: false, error: 'Camera start cancelled.' };
      }

      streamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      const resolvedDeviceId = videoTrack?.getSettings?.().deviceId || requestedDeviceId || null;
      setActiveDeviceId(resolvedDeviceId);
      void refreshDevices();

      if (videoTrack) {
        trackEndedHandlerRef.current = () => {
          if (generation !== startGenerationRef.current) {
            return;
          }

          releaseStream();
          setError('Camera disconnected. Select another camera or try again.');
          setIsReady(false);
          setIsActive(false);
        };
        videoTrack.onended = trackEndedHandlerRef.current;
      }

      const video = await waitForVideoElement(videoRef);

      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (generation === startGenerationRef.current) {
          const message = 'Camera preview is not ready. Please try again.';
          setError(message);
          return { ok: false, error: message };
        }
        return { ok: false, error: 'Camera preview is not ready.' };
      }

      video.srcObject = stream;
      await waitForVideoReady(video);

      if (generation !== startGenerationRef.current) {
        return { ok: false, error: 'Camera start cancelled.' };
      }

      try {
        await video.play();
      } catch (playErr) {
        if (
          generation !== startGenerationRef.current ||
          isBenignPlayError(playErr)
        ) {
          return { ok: false, error: 'Camera start interrupted.' };
        }
        throw playErr;
      }

      const hasDimensions = await waitForVideoDimensions(video);
      if (!hasDimensions) {
        if (generation === startGenerationRef.current) {
          const message = 'Camera preview is not ready. Please try again.';
          setError(message);
          releaseStream();
          return { ok: false, error: message };
        }
        return { ok: false, error: 'Camera preview is not ready.' };
      }

      if (generation !== startGenerationRef.current) {
        return { ok: false, error: 'Camera start cancelled.' };
      }

      setIsReady(true);
      setIsActive(true);
      logFaceStep(1, 'camera opened');
      return { ok: true };
    } catch (err) {
      if (generation !== startGenerationRef.current) {
        return { ok: false, error: 'Camera start cancelled.' };
      }

      if (isBenignPlayError(err)) {
        return { ok: false, error: 'Camera start interrupted.' };
      }

      const mapped = mapCameraStartError(err);
      const message = CAMERA_ERROR_MESSAGES[mapped]
        || err?.message
        || 'Camera access denied. Allow camera permissions and try again.';
      setError(message);
      setIsReady(false);
      setIsActive(false);
      releaseStream();
      return { ok: false, error: message };
    }
  }, [activeDeviceId, refreshDevices, releaseStream, videoConstraints]);

  const switchDevice = useCallback(async (deviceId) => {
    setActiveDeviceId(deviceId);
    stop();
    return start({ deviceId, forceRestart: true });
  }, [start, stop]);

  const restart = useCallback(async () => {
    stop();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return start({ forceRestart: true });
  }, [start, stop]);

  useEffect(() => () => {
    stop();
  }, [stop]);

  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
      return null;
    }

    return captureCompressedFaceBlob(video, {
      maxWidth: captureMaxWidth,
      quality: captureQuality,
    });
  }, [captureMaxWidth, captureQuality]);

  return {
    videoRef,
    error,
    isReady,
    isActive,
    devices,
    activeDeviceId,
    start,
    stop,
    restart,
    switchDevice,
    refreshDevices,
    captureFrame,
  };
}
