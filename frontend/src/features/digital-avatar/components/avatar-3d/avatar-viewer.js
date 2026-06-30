'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/utils/cn';
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from '@/components/ui/glass-card';
import {
  HAIR_COLOR_OPTIONS,
  SKIN_TONE_OPTIONS,
} from '../../constants/outfit-builder.constants';

const Avatar3DScene = dynamic(
  () => import('./avatar-3d-scene').then((module) => module.Avatar3DScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-white/60">
        Loading preview…
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

export function AvatarViewer({
  modelUrl,
  bodyType,
  skinTone,
  hairColor,
  bodyTypeLabel,
  className,
  showHeader = true,
  compact = false,
}) {
  const skinLabel = resolveOptionLabel(SKIN_TONE_OPTIONS, skinTone);
  const hairLabel = resolveOptionLabel(HAIR_COLOR_OPTIONS, hairColor);

  return (
    <GlassCard
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden',
        className,
      )}
    >
      <GlassCardContent className="flex h-full min-h-0 flex-col gap-6 p-6 sm:p-8">
        {showHeader ? (
          <GlassCardHeader>
            <GlassCardTitle>3D Digital Avatar</GlassCardTitle>
            <GlassCardDescription>
              Create your personalized fashion avatar
            </GlassCardDescription>
          </GlassCardHeader>
        ) : null}

        <div
          className={cn(
            'relative min-h-0 flex-1 overflow-hidden rounded-[24px] border border-white/10',
            compact ? 'min-h-[320px]' : 'min-h-[420px] lg:min-h-[480px]',
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.18)_0%,rgba(15,23,42,0.2)_45%,transparent_72%)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute left-1/2 top-[62%] h-10 w-[42%] -translate-x-1/2 rounded-full bg-black/50 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute left-1/2 top-[38%] h-40 w-40 -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl"
            aria-hidden="true"
          />

          <Avatar3DScene
            modelUrl={modelUrl}
            bodyType={bodyType}
            skinTone={skinTone}
            hairColor={hairColor}
            className="relative z-[1] h-full min-h-[inherit] w-full"
          />

          <p className="pointer-events-none absolute inset-x-0 bottom-4 z-[2] text-center text-xs text-white/50">
            Drag to rotate · Scroll to zoom
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {bodyTypeLabel ? <AvatarStatPill>{bodyTypeLabel}</AvatarStatPill> : null}
          <AvatarStatPill>{skinLabel} Skin</AvatarStatPill>
          <AvatarStatPill>{hairLabel} Hair</AvatarStatPill>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
