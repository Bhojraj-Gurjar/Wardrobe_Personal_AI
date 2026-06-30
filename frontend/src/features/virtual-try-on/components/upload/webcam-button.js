'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { VTO_TRANSITION } from '../../styles/virtual-try-on-tokens';

export function WebcamButton({ onCapture, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const closeModal = useCallback(() => {
    stopStream();
    setIsOpen(false);
    setCameraError('');
  }, [stopStream]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCameraError('Could not access camera. Check permissions and try again.');
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [isOpen, stopStream]);

  const handleCapture = async () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth) {
      return;
    }

    setIsCapturing(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0);

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.92);
      });

      if (blob) {
        const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        closeModal();
      }
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08]',
          'bg-transparent text-sm font-medium text-white/80',
          'hover:border-[#7C3AED]/40 hover:bg-white/[0.04] hover:text-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]',
          'disabled:pointer-events-none disabled:opacity-50',
          VTO_TRANSITION,
        )}
      >
        <Camera className="size-4" aria-hidden="true" />
        Open Camera
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Webcam capture"
        >
          <div className="w-full max-w-lg rounded-[20px] border border-white/[0.08] bg-[#141B2D] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Take a Photo</h3>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close camera"
                className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {cameraError ? (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {cameraError}
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-xl border border-white/[0.08] py-3 text-sm font-medium text-white/70 hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(cameraError) || isCapturing}
                onClick={handleCapture}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white',
                  'bg-gradient-to-r from-[#7C3AED] to-[#A855F7]',
                  'disabled:opacity-50',
                )}
              >
                {isCapturing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
                Capture
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
