'use client';

import { Shirt } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { BodyTypeSelector } from './body-type-selector';
import { SkinToneSelector } from '../skin-tone-selector';
import { HairColorSelector } from '../hair-color-selector';

export function AvatarSettings({
  selectedPresetId,
  onPresetChange,
  skinTone,
  hairColor,
  onSkinToneChange,
  onHairColorChange,
  onSave,
  onClose,
  isSaving = false,
  className,
}) {
  return (
    <GlassCard className={cn('flex h-full min-h-0 flex-col', className)}>
      <GlassCardContent className="flex h-full min-h-0 flex-col gap-0 p-6 sm:p-8">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
          <BodyTypeSelector
            value={selectedPresetId}
            onChange={onPresetChange}
          />

          <SkinToneSelector
            value={skinTone}
            onChange={onSkinToneChange}
            className="mb-6"
          />

          <HairColorSelector
            value={hairColor}
            onChange={onHairColorChange}
            className="mb-6"
          />

          <section className="mb-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dashboard-muted">
              Clothing
            </p>
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-[#0F172A]/80 px-4 py-5 text-sm text-dashboard-muted">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300">
                <Shirt className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-medium text-dashboard-foreground">Outfit layers</p>
                <p className="mt-0.5 text-xs leading-relaxed">
                  Customize clothing from the main avatar page after saving your 3D look.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 shrink-0 space-y-3 border-t border-white/10 pt-6">
          <PrimaryButton onClick={onSave} isLoading={isSaving} disabled={isSaving}>
            {isSaving ? 'Saving avatar…' : 'Save 3D Avatar'}
          </PrimaryButton>
          <SecondaryButton onClick={onClose} disabled={isSaving}>
            Close
          </SecondaryButton>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
