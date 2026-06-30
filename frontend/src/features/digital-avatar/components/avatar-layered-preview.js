'use client';

import { useCallback, useState } from 'react';
import { cn } from '@/utils/cn';
import { AVATAR_VIEW_MODES } from '../constants/avatar-3d.constants';
import { getBrandTags } from '../utils/outfit-builder.util';
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from '@/components/ui/glass-card';
import { SkinToneSelector } from './skin-tone-selector';
import { HairColorSelector } from './hair-color-selector';
import { AvatarControls } from './avatar-controls';
import { AvatarLayerStack } from './avatar-layer-stack';
import { Avatar3DPreview } from './avatar-3d/avatar-3d-preview';
import { AvatarViewModeToggle } from './avatar-3d/avatar-view-mode-toggle';
import { Avatar3DCreatorModal } from './avatar-3d/avatar-3d-creator-modal';

export function AvatarLayeredPreview({
  avatar,
  baseAvatarUrl,
  model3dUrl,
  bodyType,
  outfit,
  skinTone,
  hairColor,
  onSkinToneChange,
  onHairColorChange,
  onAvatar3dSave,
  isSavingModel3d = false,
  onExport,
  onCompare,
  compareMode,
  onSuggest,
  isSuggesting,
  className,
}) {
  const [viewMode, setViewMode] = useState(AVATAR_VIEW_MODES.THREE_D);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const brandTags = getBrandTags(outfit);
  const hasCustomModel = Boolean(model3dUrl);

  const handleAvatarSave = useCallback((payload) => {
    onAvatar3dSave?.(payload);
    setCreatorOpen(false);
    setViewMode(AVATAR_VIEW_MODES.THREE_D);
  }, [onAvatar3dSave]);

  return (
    <>
      <GlassCard
        className={cn(
          'flex h-full min-h-[720px] flex-col',
          className,
        )}
      >
        <GlassCardContent className="flex h-full min-h-[720px] flex-col gap-6 p-6">
          <GlassCardHeader className="shrink-0">
            <GlassCardTitle>3D Digital Avatar</GlassCardTitle>
            <GlassCardDescription>
              Create your personalized fashion avatar
            </GlassCardDescription>
          </GlassCardHeader>

          <div className="relative min-h-0 flex-1">
            {viewMode === AVATAR_VIEW_MODES.THREE_D ? (
              <Avatar3DPreview
                model3dUrl={model3dUrl}
                bodyType={bodyType}
                skinTone={skinTone}
                hairColor={hairColor}
                hasCustomModel={hasCustomModel}
                onEditAvatar={() => setCreatorOpen(true)}
                isSaving={isSavingModel3d}
                modeToggle={(
                  <AvatarViewModeToggle
                    value={viewMode}
                    onChange={setViewMode}
                  />
                )}
                className="h-full"
              />
            ) : (
              <div className="flex h-full min-h-[580px] flex-col">
                <div
                  className={cn(
                    'relative flex flex-1 items-center justify-center overflow-hidden',
                    'rounded-[24px] border border-white/10',
                    'bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15),transparent_60%)]',
                  )}
                >
                  <div className="pointer-events-none absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
                    <div className="pointer-events-auto">
                      <AvatarViewModeToggle
                        value={viewMode}
                        onChange={setViewMode}
                      />
                    </div>
                  </div>

                  <AvatarLayerStack
                    baseAvatarUrl={baseAvatarUrl}
                    outfit={outfit}
                    className="relative z-[1] max-h-[min(72vh,520px)] w-full max-w-md"
                  />

                  {brandTags.length ? (
                    <div className="absolute bottom-4 left-0 right-0 z-10 flex flex-wrap justify-center gap-2 px-4">
                      {brandTags.map((brand) => (
                        <span
                          key={brand}
                          className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] font-semibold tracking-wider text-white/80 backdrop-blur"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 space-y-4 border-t border-white/10 pt-6">
            {viewMode === AVATAR_VIEW_MODES.TWO_D ? (
              <div className="space-y-6">
                <SkinToneSelector value={skinTone} onChange={onSkinToneChange} />
                <HairColorSelector value={hairColor} onChange={onHairColorChange} />
              </div>
            ) : null}

            <AvatarControls
              onExport={onExport}
              onCompare={onCompare}
              compareMode={compareMode}
              onSuggest={onSuggest}
              isSuggesting={isSuggesting}
            />
          </div>
        </GlassCardContent>
      </GlassCard>

      <Avatar3DCreatorModal
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        avatar={avatar}
        onSave={handleAvatarSave}
        isSaving={isSavingModel3d}
      />
    </>
  );
}
