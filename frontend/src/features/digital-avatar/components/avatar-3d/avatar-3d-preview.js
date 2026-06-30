'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { UserRoundPen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { resolveAvatar3dModelUrl } from '../../constants/avatar-3d.constants';
import {
  HAIR_COLOR_OPTIONS,
  SKIN_TONE_OPTIONS,
} from '../../constants/outfit-builder.constants';
import { Avatar3DViewerControls } from './avatar-3d-viewer-controls';

const Avatar3DScene = dynamic(
  () => import('./avatar-3d-scene').then((module) => module.Avatar3DScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-32 w-24 rounded-2xl bg-white/5" />
          <p className="text-xs font-medium text-white/60">Loading Avatar…</p>
        </div>
      </div>
    ),
  },
);

function resolveOptionLabel(options, id) {
  return options.find((option) => option.id === id)?.label || id;
}

function AvatarStatPill({ children }) {
  return (
    <span className="rounded-full bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-[#DDD6FE]">
      {children}
    </span>
  );
}

export function Avatar3DPreview({
  model3dUrl,
  bodyType,
  skinTone,
  hairColor,
  hasCustomModel = false,
  onEditAvatar,
  isSaving = false,
  modeToggle = null,
  className,
}) {
  const sceneRef = useRef(null);
  const resolvedUrl = resolveAvatar3dModelUrl({ model3dUrl, bodyType });
  const bodyTypeLabel = bodyType
    ? String(bodyType).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Average';

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div
        className={cn(
          'relative flex min-h-[580px] flex-1 items-center justify-center overflow-hidden',
          'rounded-[24px] border border-white/10',
          'bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15),transparent_60%)]',
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[#0B1020]/40"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/2 top-[68%] h-12 w-[48%] -translate-x-1/2 rounded-full bg-black/55 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="absolute inset-0 z-[1] flex items-center justify-center">
          <Avatar3DScene
            ref={sceneRef}
            modelUrl={resolvedUrl}
            bodyType={bodyType}
            skinTone={skinTone}
            hairColor={hairColor}
            className="h-full w-full"
          />
        </div>

        {modeToggle ? (
          <div className="pointer-events-none absolute left-4 top-4 z-[3] sm:left-6 sm:top-6">
            <div className="pointer-events-auto">{modeToggle}</div>
          </div>
        ) : null}

        <div className="pointer-events-none absolute right-4 top-4 z-[3] sm:right-6 sm:top-6">
          <Avatar3DViewerControls
            onZoomIn={() => sceneRef.current?.zoomIn()}
            onZoomOut={() => sceneRef.current?.zoomOut()}
            onReset={() => sceneRef.current?.resetView()}
          />
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 z-[3] sm:bottom-6 sm:left-6">
          <button
            type="button"
            onClick={onEditAvatar}
            disabled={isSaving}
            className={cn(
              'pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full',
              'border border-white/15 bg-[#0F172A]/90 px-4 text-xs font-semibold text-white',
              'backdrop-blur-sm transition-colors hover:bg-purple-600/90',
              'disabled:opacity-50',
            )}
          >
            <UserRoundPen className="size-3.5" />
            {hasCustomModel ? 'Edit 3D Avatar' : 'Create 3D Avatar'}
          </button>
        </div>

        <p className="pointer-events-none absolute inset-x-0 bottom-4 z-[2] text-center text-[11px] text-white/45 sm:bottom-6">
          Drag to rotate · Scroll to zoom · double-click to reset
        </p>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <AvatarStatPill>{bodyTypeLabel}</AvatarStatPill>
        <AvatarStatPill>{resolveOptionLabel(SKIN_TONE_OPTIONS, skinTone)} Skin</AvatarStatPill>
        <AvatarStatPill>{resolveOptionLabel(HAIR_COLOR_OPTIONS, hairColor)} Hair</AvatarStatPill>
      </div>
    </div>
  );
}
