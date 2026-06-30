'use client';

import Image from 'next/image';
import { cn } from '@/utils/cn';
import { AVATAR_LAYER_SIZE, encodeAvatarAssetUrl } from '../constants/avatar-assets.constants';
import { buildAvatarRenderLayers } from '../utils/avatar-layer-engine';

const STACK_CLASS = cn(
  'relative mx-auto aspect-[280/520] h-full w-auto max-h-full max-w-[280px]',
);

export function AvatarLayerStack({
  baseAvatarUrl,
  outfit,
  className,
  'aria-label': ariaLabel = 'Digital avatar preview',
}) {
  const layers = buildAvatarRenderLayers({ baseAvatarUrl, outfit });

  if (!layers.length) {
    return (
      <div
        className={cn(STACK_CLASS, className)}
        aria-label={ariaLabel}
        role="img"
      >
        <div className="flex h-full min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-white/10 px-4 text-center text-sm text-dashboard-muted">
          Generate your avatar to begin
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(STACK_CLASS, className)}
      aria-label={ariaLabel}
      role="img"
    >
      {layers.map((layer) => (
        <Image
          key={`${layer.layerId}-${layer.productId || 'base'}`}
          src={encodeAvatarAssetUrl(layer.overlayUrl)}
          alt=""
          width={AVATAR_LAYER_SIZE.width}
          height={AVATAR_LAYER_SIZE.height}
          unoptimized
          priority={layer.layerId === 'base'}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{ zIndex: layer.zIndex }}
        />
      ))}
    </div>
  );
}
