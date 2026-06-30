'use client';

import { ExternalLink, Settings2, Sparkles } from 'lucide-react';
import {
  AVATAR_SETUP_GUIDE_URL,
  AVATURN_STUDIO_URL,
} from '@/features/digital-avatar/constants/avatar-creator.constants';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';

export function AvatarServiceNotConfigured({
  onUseNativeCreator,
  onRetry,
  onClose,
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Settings2 className="size-8" />
      </div>

      <h3 className="text-xl font-bold text-dashboard-foreground">
        Avatar Service Not Configured
      </h3>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-dashboard-muted">
        The external avatar studio could not be reached. You can generate your fashion
        avatar using Wardrobe AI&apos;s built-in creator powered by your face analysis,
        body measurements, and Fashion DNA.
      </p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
        <PrimaryButton onClick={onUseNativeCreator}>
          <Sparkles className="size-4" />
          Use Wardrobe AI Creator
        </PrimaryButton>

        {onRetry ? (
          <SecondaryButton onClick={onRetry}>Retry connection</SecondaryButton>
        ) : null}

        <a
          href={AVATURN_STUDIO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-dashboard-foreground transition-colors hover:bg-white/5"
        >
          Configure Avaturn Studio
          <ExternalLink className="size-4" />
        </a>

        <a
          href={AVATAR_SETUP_GUIDE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          Open setup guide
        </a>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="mt-2 text-sm text-dashboard-muted hover:text-dashboard-foreground"
          >
            Close
          </button>
        ) : null}
      </div>
    </div>
  );
}
