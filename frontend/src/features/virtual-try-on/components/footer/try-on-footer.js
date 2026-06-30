'use client';

import { cn } from '@/utils/cn';
import { ActionButtons } from './action-buttons';

export function TryOnFooter({
  selectedProduct,
  selectedOutfitItems = [],
  tryOnModeLabel,
  hasBodyPhoto,
  hasResult,
  isGenerating,
  isSaving,
  isSaved,
  onTryOn,
  onSaveLook,
  canTryOn,
  className,
}) {
  const canGenerate = canTryOn && (hasBodyPhoto || hasResult);

  return (
    <footer
      className={cn(
        'sticky bottom-0 z-10 border-t border-white/[0.08] bg-[#141B2D]/95 p-5 backdrop-blur-md',
        'max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:rounded-none',
        className,
      )}
    >
      {selectedOutfitItems.length > 1 ? (
        <p className="mb-3 text-center text-xs text-white/45 sm:text-left">
          {selectedOutfitItems.map(({ product }) => product.name).join(' + ')}
        </p>
      ) : selectedProduct ? (
        <p className="mb-3 truncate text-center text-xs text-white/45 sm:text-left">
          {tryOnModeLabel ? `${tryOnModeLabel} · ` : ''}
          {selectedProduct.brand} · {selectedProduct.name}
        </p>
      ) : tryOnModeLabel ? (
        <p className="mb-3 text-center text-xs text-white/45 sm:text-left">{tryOnModeLabel}</p>
      ) : null}

      <ActionButtons
        isGenerating={isGenerating}
        isSaving={isSaving}
        isSaved={isSaved}
        hasResult={hasResult}
        canTryOn={canGenerate}
        onTryOn={onTryOn}
        onSaveLook={onSaveLook}
      />
    </footer>
  );
}
