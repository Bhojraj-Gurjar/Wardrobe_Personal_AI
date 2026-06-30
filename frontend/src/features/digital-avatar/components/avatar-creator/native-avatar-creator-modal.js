'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dna, ScanFace, Sparkles, UserRound, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  AVATAR_3D_PRESETS,
  resolveAvatarAppearanceDefaults,
} from '@/features/digital-avatar/constants/avatar-3d.constants';
import { mapGenerationProfileToNativeDefaults } from '@/features/digital-avatar/utils/avatar-creator.util';
import { AvatarViewer } from '@/features/digital-avatar/components/avatar-3d/avatar-viewer';
import { AvatarSettings } from '@/features/digital-avatar/components/avatar-3d/avatar-settings';

function TraitBadge({ icon: Icon, label, value }) {
  if (!value) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-dashboard-foreground">
      <Icon className="size-3 text-primary" />
      {label}: {value}
    </span>
  );
}

export function NativeAvatarCreatorModal({
  open,
  onClose,
  avatar,
  generationProfile,
  onSave,
  isSaving = false,
}) {
  const defaults = useMemo(
    () => mapGenerationProfileToNativeDefaults(generationProfile, avatar),
    [avatar, generationProfile],
  );

  const appearanceDefaults = useMemo(
    () => resolveAvatarAppearanceDefaults({
      ...avatar,
      bodyType: defaults.bodyType,
      skinTone: defaults.skinTone,
      hairColor: defaults.hairColor,
    }),
    [avatar, defaults],
  );

  const initialPreset = useMemo(() => {
    const fromBody = AVATAR_3D_PRESETS.find(
      (preset) => preset.bodyType === appearanceDefaults.bodyType,
    );
    return fromBody?.id || AVATAR_3D_PRESETS[0].id;
  }, [appearanceDefaults.bodyType]);

  const [selectedPresetId, setSelectedPresetId] = useState(initialPreset);
  const [skinTone, setSkinTone] = useState(appearanceDefaults.skinTone);
  const [hairColor, setHairColor] = useState(appearanceDefaults.hairColor);

  useEffect(() => {
    if (!open) return;

    setSelectedPresetId(initialPreset);
    setSkinTone(appearanceDefaults.skinTone);
    setHairColor(appearanceDefaults.hairColor);
  }, [appearanceDefaults.hairColor, appearanceDefaults.skinTone, initialPreset, open]);

  const selectedPreset = AVATAR_3D_PRESETS.find((preset) => preset.id === selectedPresetId)
    || AVATAR_3D_PRESETS[0];

  if (!open) {
    return null;
  }

  const handleSave = () => {
    onSave?.({
      model3dUrl: selectedPreset.modelUrl,
      bodyType: selectedPreset.bodyType,
      skinTone,
      hairColor,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1020]/92 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex h-[min(94dvh,900px)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0F172A] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="size-4 text-primary" />
              Wardrobe AI Avatar Creator
            </p>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-dashboard-muted">
              Personalized from your onboarding face photo, body analysis, and Fashion DNA.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <TraitBadge icon={UserRound} label="Body" value={generationProfile?.bodyType} />
              <TraitBadge icon={ScanFace} label="Face" value={generationProfile?.faceShape} />
              <TraitBadge icon={Dna} label="Style" value={generationProfile?.styleArchetype?.replace(/-/g, ' ')} />
              <TraitBadge icon={UserRound} label="Skin" value={generationProfile?.skinTone} />
              <TraitBadge icon={UserRound} label="Hair" value={generationProfile?.hairStyle} />
              <TraitBadge icon={UserRound} label="Beard" value={generationProfile?.beardStyle} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={cn(
              'flex size-10 items-center justify-center rounded-xl border border-white/10',
              'text-white/70 transition-colors hover:bg-white/5 hover:text-white',
            )}
            aria-label="Close avatar creator"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 p-5 lg:grid-cols-[3fr_2fr] lg:p-6">
          <AvatarViewer
            modelUrl={selectedPreset.modelUrl}
            bodyType={selectedPreset.bodyType}
            skinTone={skinTone}
            hairColor={hairColor}
            bodyTypeLabel={selectedPreset.label}
            compact
          />

          <AvatarSettings
            selectedPresetId={selectedPresetId}
            onPresetChange={setSelectedPresetId}
            skinTone={skinTone}
            hairColor={hairColor}
            onSkinToneChange={setSkinTone}
            onHairColorChange={setHairColor}
            onSave={handleSave}
            onClose={onClose}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
