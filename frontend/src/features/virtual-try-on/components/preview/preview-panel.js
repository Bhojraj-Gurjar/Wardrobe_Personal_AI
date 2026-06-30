'use client';

import { cn } from '@/utils/cn';
import { resolveTryOnResultImageUrl } from '../../utils/try-on-image.util';
import { VTO_CARD_CLASS } from '../../styles/virtual-try-on-tokens';
import { EmptyPreview } from './empty-preview';
import { LoadingPreview } from './loading-preview';
import { GeneratedPreview } from './generated-preview';
import { TryOnFooter } from '../footer/try-on-footer';

export function PreviewPanel({
  bodyPhotoUrl,
  generatedImageUrl,
  selectedProduct,
  selectedOutfitItems = [],
  tryOnModeLabel,
  isGenerating,
  loadingPhase,
  loadingProgress = 0,
  isSaving,
  isSaved,
  isAddingToCloset,
  addedToCloset,
  errorMessage,
  onTryOn,
  onSaveLook,
  onRegenerate,
  onAddToCloset,
  canTryOn,
  className,
}) {
  const resolvedResultUrl = resolveTryOnResultImageUrl(generatedImageUrl);
  const hasResult = Boolean(resolvedResultUrl);
  const hasBodyPhoto = Boolean(bodyPhotoUrl);

  return (
    <section
      className={cn(
        VTO_CARD_CLASS,
        'relative flex min-h-[min(88vh,820px)] flex-col overflow-hidden',
        'bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.08)_0%,_transparent_70%)]',
        className,
      )}
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        {isGenerating ? (
          <LoadingPreview loadingPhase={loadingPhase} loadingProgress={loadingProgress} />
        ) : hasResult ? (
          <GeneratedPreview
            generatedImageUrl={generatedImageUrl}
            isAddingToCloset={isAddingToCloset}
            addedToCloset={addedToCloset}
            onRegenerate={onRegenerate}
            onAddToCloset={onAddToCloset}
          />
        ) : (
          <EmptyPreview />
        )}
      </div>

      {errorMessage ? (
        <div className="mx-5 mb-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      ) : null}

      <TryOnFooter
        selectedProduct={selectedProduct}
        selectedOutfitItems={selectedOutfitItems}
        tryOnModeLabel={tryOnModeLabel}
        hasBodyPhoto={hasBodyPhoto}
        hasResult={hasResult}
        isGenerating={isGenerating}
        isSaving={isSaving}
        isSaved={isSaved}
        onTryOn={onTryOn}
        onSaveLook={onSaveLook}
        canTryOn={canTryOn ?? Boolean(selectedProduct)}
      />
    </section>
  );
}
