'use client';

import { Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/utils/cn';

function ScanRing({ isScanning, progress }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 rounded-full',
        isScanning ? 'animate-[spin_3s_linear_infinite]' : '',
      )}
      aria-hidden="true"
    >
      <svg className="size-full" viewBox="0 0 280 280">
        <circle
          cx="140"
          cy="140"
          r="132"
          fill="none"
          stroke="rgba(147,51,234,0.25)"
          strokeWidth="3"
        />
        <circle
          cx="140"
          cy="140"
          r="132"
          fill="none"
          stroke="#9333EA"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${Math.max(8, progress) * 8} 820`}
          className={isScanning ? 'drop-shadow-[0_0_12px_rgba(147,51,234,0.8)]' : ''}
        />
      </svg>
    </div>
  );
}

export function PremiumFaceScanner({
  videoRef,
  isActive,
  isReady,
  isScanning = false,
  progress = 0,
  className,
}) {
  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'relative size-[280px] overflow-hidden rounded-full',
          'border border-[#9333EA]/40 bg-[#111827]/80',
          'shadow-[0_0_40px_rgba(147,51,234,0.18)]',
          'backdrop-blur-md',
        )}
      >
        <ScanRing isScanning={isScanning} progress={progress} />

        {isActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="mirror size-full object-cover"
              aria-label="Live camera preview"
            />

            <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-[#9333EA]/10 via-transparent to-black/35" />

            {!isReady ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <Loader2 className="size-8 animate-spin text-[#9333EA]" aria-hidden="true" />
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex size-full items-center justify-center bg-[#1A2235] text-sm text-white/60">
            Camera inactive
          </div>
        )}
      </div>

      <div
        className="pointer-events-none absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#9333EA]/30 bg-[#111827]/90 px-3 py-1.5 text-[11px] text-[#DDD6FE] backdrop-blur"
        aria-hidden="true"
      >
        <ShieldCheck className="size-3.5 text-emerald-300" />
        <span>AI liveness protected</span>
      </div>
    </div>
  );
}

export { PremiumFaceScanner as FaceLoginScanCard };
