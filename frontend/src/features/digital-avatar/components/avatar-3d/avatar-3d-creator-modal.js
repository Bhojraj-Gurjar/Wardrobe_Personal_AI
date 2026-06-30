'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  AVATAR_3D_PRESETS,
  resolveAvatarAppearanceDefaults,
} from '../../constants/avatar-3d.constants';
import { AvatarViewer } from './avatar-viewer';
import { AvatarSettings } from './avatar-settings';

export function Avatar3DCreatorModal({
  open,
  onClose,
  avatar,
  onSave,
  isSaving = false,
}) {
  const defaults = useMemo(() => resolveAvatarAppearanceDefaults(avatar), [avatar]);
  const initialPreset = useMemo(() => {
    const fromBody = AVATAR_3D_PRESETS.find((preset) => preset.bodyType === defaults.bodyType);
    return fromBody?.id || AVATAR_3D_PRESETS[0].id;
  }, [defaults.bodyType]);

  const [selectedPresetId, setSelectedPresetId] = useState(initialPreset);
  const [skinTone, setSkinTone] = useState(defaults.skinTone);
  const [hairColor, setHairColor] = useState(defaults.hairColor);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedPresetId(initialPreset);
    setSkinTone(defaults.skinTone);
    setHairColor(defaults.hairColor);
  }, [defaults.hairColor, defaults.skinTone, initialPreset, open]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1020]/90 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-3d-creator-title"
    >
      <div className="flex h-[min(94dvh,880px)] w-full max-w-6xl flex-col overflow-hidden">
        <div className="mb-4 flex items-center justify-between px-1 sm:px-2">
          <h2 id="avatar-3d-creator-title" className="sr-only">
            Create your 3D avatar
          </h2>
          <p className="text-sm text-dashboard-muted sm:text-base">
            Customize your avatar, then save to your profile.
          </p>
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

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr] lg:gap-8">
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
