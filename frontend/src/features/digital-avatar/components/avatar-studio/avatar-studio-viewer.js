'use client';

import { useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Camera,
  Orbit,
  RefreshCw,
  RotateCw,
  Sparkles,
  UserRoundPen,
} from 'lucide-react';
import { AVATAR_CAMERA_PRESETS } from '@/features/digital-avatar/constants/rpm.constants';
import {
  AVATAR_CREATOR_PROVIDERS,
} from '@/features/digital-avatar/constants/avatar-creator.constants';
import { AvaturnCreatorPanel } from '@/features/digital-avatar/components/avatar-creator/avaturn-creator-panel';
import {
  isAvaturnConfigured,
  isAvaturnModelUrl,
  isLegacyReadyPlayerMeUrl,
  resolveAvatarCreatorProvider,
} from '@/features/digital-avatar/utils/avatar-creator.util';
import { normalizeHostedModelUrl } from '@/features/digital-avatar/utils/avatar-model.util';
import { resolveAvatar3dModelUrl } from '@/features/digital-avatar/constants/avatar-3d.constants';
import { Avatar3DViewerControls } from '@/features/digital-avatar/components/avatar-3d/avatar-3d-viewer-controls';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

const Avatar3DScene = dynamic(
  () => import('../avatar-3d/avatar-3d-scene').then((module) => module.Avatar3DScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <Skeleton className="h-32 w-24 rounded-2xl bg-white/5" />
      </div>
    ),
  },
);

function PresetButton({ preset, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors',
        active
          ? 'bg-primary/25 text-primary'
          : 'bg-white/5 text-white/65 hover:bg-white/10 hover:text-white',
      )}
    >
      {preset.label}
    </button>
  );
}

export function AvatarStudioViewer({
  model3dUrl,
  bodyType,
  skinTone,
  hairColor,
  outfit,
  generationProfile,
  hasCustom3dAvatar: hasCustomAvatar = false,
  creatorMode = false,
  onAvatarExported,
  onCloseCreator,
  onFallbackToNative,
  onEditAvatar,
  isSaving = false,
  className,
}) {
  const sceneRef = useRef(null);
  const [cameraPreset, setCameraPreset] = useState('fullBody');
  const [autoSpin, setAutoSpin] = useState(false);
  const creatorProvider = resolveAvatarCreatorProvider();
  const useAvaturnInline = creatorProvider === AVATAR_CREATOR_PROVIDERS.AVATURN
    && isAvaturnConfigured();
  const hostedModelUrl = isLegacyReadyPlayerMeUrl(model3dUrl) ? null : model3dUrl;
  const showInlineAvaturn = useAvaturnInline && (creatorMode || !hasCustomAvatar);
  const showSavedAvaturnModel = useAvaturnInline
    && hasCustomAvatar
    && Boolean(hostedModelUrl)
    && !creatorMode;
  const resolvedUrl = showSavedAvaturnModel
    ? (normalizeHostedModelUrl(hostedModelUrl) || hostedModelUrl)
    : hostedModelUrl
      ? (normalizeHostedModelUrl(hostedModelUrl) || hostedModelUrl)
      : resolveAvatar3dModelUrl({ model3dUrl: null, bodyType });
  const showThreeScene = !showInlineAvaturn;
  const heightScale = generationProfile?.heightScale || 1;

  const applyPreset = useCallback((presetId) => {
    setCameraPreset(presetId);
    sceneRef.current?.setCameraPreset?.(presetId);
  }, []);

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div
        className={cn(
          'relative flex min-h-[70vh] flex-1 items-center justify-center overflow-hidden',
          'rounded-[24px] border border-white/10',
          'bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.18),transparent_62%)]',
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[#0B1020]/35" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-[72%] h-14 w-[52%] -translate-x-1/2 rounded-full bg-black/55 blur-2xl" />

        {showInlineAvaturn ? (
          <div className="absolute inset-0 z-[1]">
            <AvaturnCreatorPanel
              onExported={onAvatarExported}
              onFallbackToNative={onFallbackToNative}
              onClose={onCloseCreator}
            />
          </div>
        ) : null}

        {showThreeScene ? (
          <div className="absolute inset-0 z-[1]">
            <Avatar3DScene
              ref={sceneRef}
              modelUrl={resolvedUrl}
              bodyType={bodyType}
              skinTone={skinTone}
              hairColor={hairColor}
              outfit={outfit}
              heightScale={heightScale}
              cameraPreset={cameraPreset}
              autoSpin={autoSpin}
              className="h-full w-full"
            />
          </div>
        ) : null}

        {showThreeScene ? (
          <>
            <div className="pointer-events-none absolute left-4 top-4 z-[3] sm:left-6 sm:top-6">
              <div className="pointer-events-auto flex flex-wrap gap-2">
                {Object.values(AVATAR_CAMERA_PRESETS).map((preset) => (
                  <PresetButton
                    key={preset.id}
                    preset={preset}
                    active={cameraPreset === preset.id}
                    onClick={() => applyPreset(preset.id)}
                  />
                ))}
              </div>
            </div>

            <div className="pointer-events-none absolute right-4 top-4 z-[3] sm:right-6 sm:top-6">
              <Avatar3DViewerControls
                onZoomIn={() => sceneRef.current?.zoomIn()}
                onZoomOut={() => sceneRef.current?.zoomOut()}
                onReset={() => sceneRef.current?.resetView()}
              />
            </div>
          </>
        ) : null}

        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-[3] flex flex-wrap items-center justify-between gap-3 sm:bottom-6 sm:left-6 sm:right-6">
          {!(showInlineAvaturn && !hasCustomAvatar) ? (
            <button
              type="button"
              onClick={onEditAvatar}
              disabled={isSaving}
              className={cn(
                'pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full',
                'border border-white/15 bg-[#0F172A]/90 px-4 text-xs font-semibold text-white backdrop-blur-sm',
                'transition-colors hover:bg-primary/90 disabled:opacity-50',
              )}
            >
              {hasCustomAvatar ? (
                <UserRoundPen className="size-3.5" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {showInlineAvaturn
                ? 'Avatar Studio'
                : hasCustomAvatar
                  ? 'Refine Avatar'
                  : 'Generate Avatar'}
            </button>
          ) : (
            <span className="pointer-events-auto rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs text-white/70 backdrop-blur-sm">
              Avaturn Studio Active
            </span>
          )}

          <div className="pointer-events-auto flex items-center gap-2">
            {showInlineAvaturn && onCloseCreator && hasCustomAvatar ? (
              <button
                type="button"
                onClick={onCloseCreator}
                className="inline-flex h-10 items-center rounded-full border border-white/15 bg-black/50 px-4 text-xs font-medium text-white/80 backdrop-blur-sm hover:bg-black/70"
              >
                Minimize
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setAutoSpin((current) => !current)}
              className={cn(
                'inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80',
                autoSpin && 'border-primary/40 bg-primary/20 text-primary',
                showInlineAvaturn && 'hidden',
              )}
              aria-label="Toggle auto spin"
            >
              <RotateCw className={cn('size-4', autoSpin && 'animate-spin')} />
            </button>
            <button
              type="button"
              onClick={() => applyPreset('front')}
              className={cn(
                'inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80',
                showInlineAvaturn && 'hidden',
              )}
              aria-label="Reset camera"
            >
              <RefreshCw className="size-4" />
            </button>
          </div>
        </div>

        <p className="pointer-events-none absolute inset-x-0 bottom-16 z-[2] text-center text-[11px] text-white/45">
          {showInlineAvaturn
            ? 'Create your photo-realistic avatar · Export when ready to save to your studio'
            : 'Drag to orbit · Scroll to zoom · Products equip instantly on avatar'}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {generationProfile?.faceShape ? (
          <span className="rounded-full bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-[#DDD6FE]">
            {generationProfile.faceShape} face
          </span>
        ) : null}
        {generationProfile?.bodyType ? (
          <span className="rounded-full bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-[#DDD6FE]">
            {generationProfile.bodyType} build
          </span>
        ) : null}
        {generationProfile?.styleArchetype ? (
          <span className="rounded-full bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-[#DDD6FE]">
            {String(generationProfile.styleArchetype).replace(/-/g, ' ')}
          </span>
        ) : null}
        {isLegacyReadyPlayerMeUrl(model3dUrl) ? (
          <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200">
            Legacy avatar — tap Generate Avatar to recreate
          </span>
        ) : null}
        {isAvaturnModelUrl(model3dUrl) ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
            <Camera className="size-3" />
            Avaturn Avatar
          </span>
        ) : null}
      </div>
    </div>
  );
}
