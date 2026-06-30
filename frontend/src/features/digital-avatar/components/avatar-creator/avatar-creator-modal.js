'use client';

import { useCallback, useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import {
  AVATAR_CREATOR_PROVIDERS,
} from '@/features/digital-avatar/constants/avatar-creator.constants';
import { resolveAvatarCreatorProvider } from '@/features/digital-avatar/utils/avatar-creator.util';
import { AvaturnCreatorPanel } from '@/features/digital-avatar/components/avatar-creator/avaturn-creator-panel';
import { NativeAvatarCreatorModal } from '@/features/digital-avatar/components/avatar-creator/native-avatar-creator-modal';
import { cn } from '@/utils/cn';

export function AvatarCreatorModal({
  open,
  onClose,
  avatar,
  generationProfile,
  onAvatarExported,
  isSaving = false,
  provider,
}) {
  const configuredProvider = provider || resolveAvatarCreatorProvider();
  const [activeProvider, setActiveProvider] = useState(configuredProvider);

  const handleClose = useCallback(() => {
    setActiveProvider(configuredProvider);
    onClose?.();
  }, [configuredProvider, onClose]);

  const handleExported = useCallback((payload) => {
    onAvatarExported?.(payload);
  }, [onAvatarExported]);

  if (!open) {
    return null;
  }

  if (activeProvider === AVATAR_CREATOR_PROVIDERS.NATIVE) {
    return (
      <NativeAvatarCreatorModal
        open={open}
        onClose={handleClose}
        avatar={avatar}
        generationProfile={generationProfile}
        onSave={handleExported}
        isSaving={isSaving}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1020]/92 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex h-[min(94dvh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0F172A] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="size-4 text-primary" />
              Create Your Fashion Avatar
            </p>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-dashboard-muted">
              Photo-realistic avatar studio powered by Avaturn. Your look is shaped by
              face analysis, body measurements, and Fashion DNA.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
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

        <div className="relative min-h-0 flex-1 p-4 sm:p-5">
          <AvaturnCreatorPanel
            onExported={handleExported}
            onFallbackToNative={() => setActiveProvider(AVATAR_CREATOR_PROVIDERS.NATIVE)}
            onClose={handleClose}
          />

          {isSaving ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm text-white">
                <Loader2 className="size-4 animate-spin" />
                Saving avatar…
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
