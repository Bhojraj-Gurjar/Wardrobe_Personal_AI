'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AvaturnSDK } from '@avaturn/sdk';
import { buildAvaturnCreatorUrl, isAvaturnConfigured } from '@/features/digital-avatar/utils/avatar-creator.util';
import { AvatarServiceNotConfigured } from '@/features/digital-avatar/components/avatar-creator/avatar-service-not-configured';

const LOAD_TIMEOUT_MS = 25000;

export function AvaturnCreatorPanel({
  onExported,
  onFallbackToNative,
  onClose,
}) {
  const containerRef = useRef(null);
  const sdkRef = useRef(null);
  const [phase, setPhase] = useState('loading');

  const initialize = useCallback(async () => {
    if (!containerRef.current) {
      return;
    }

    const creatorUrl = buildAvaturnCreatorUrl();
    if (!isAvaturnConfigured() || !creatorUrl) {
      setPhase('error');
      return;
    }

    setPhase('loading');

    try {
      if (sdkRef.current) {
        containerRef.current.innerHTML = '';
      }

      const sdk = new AvaturnSDK();
      sdkRef.current = sdk;

      await sdk.init(containerRef.current, {
        url: creatorUrl,
        iframeClassName: 'h-full w-full border-0',
      });

      sdk.on('export', (data) => {
        if (!data?.url) {
          return;
        }

        onExported?.({
          model3dUrl: data.url,
          avaturnAvatarId: data.avatarId,
          bodyType: data.gender === 'female' ? 'average' : 'athletic',
        });
      });

      sdk.on('error', () => {
        setPhase('error');
      });

      setPhase('ready');
    } catch {
      setPhase('error');
    }
  }, [onExported]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        setPhase((current) => (current === 'loading' ? 'error' : current));
      }
    }, LOAD_TIMEOUT_MS);

    initialize();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      sdkRef.current = null;
    };
  }, [initialize]);

  if (phase === 'error') {
    return (
      <AvatarServiceNotConfigured
        onUseNativeCreator={onFallbackToNative}
        onRetry={initialize}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="relative h-full min-h-[420px] w-full">
      {phase === 'loading' ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0F172A]/90 backdrop-blur-sm">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-dashboard-foreground">
            Loading Avatar Creator…
          </p>
          <p className="text-xs text-dashboard-muted">
            Preparing your fashion avatar studio
          </p>
        </div>
      ) : null}

      <div ref={containerRef} className="h-full min-h-[420px] w-full overflow-hidden rounded-2xl" />
    </div>
  );
}
