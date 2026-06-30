'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProductsQuery } from '@/features/products/hooks';
import {
  useAvatarQuery,
  useSaveAvatarLookToClosetMutation,
  useSaveAvatarOutfitMutation,
  useUpdateAvatarMutation,
} from '@/features/digital-avatar/hooks/use-avatar';
import { useOutfitBuilder } from '@/features/digital-avatar/hooks/use-outfit-builder';
import { useAiOutfitSuggest } from '@/features/digital-avatar/hooks/use-ai-outfit-suggest';
import { useShopOutfitLook } from '@/features/digital-avatar/hooks/use-shop-outfit-look';
import { useFashionDnaQuery } from '@/features/fashion-dna/hooks';
import { CATEGORY_TABS } from '@/features/digital-avatar/constants/outfit-builder.constants';
import { getProductsForCategory } from '@/features/digital-avatar/utils/outfit-builder.util';
import {
  resolveHairColorForAvatar,
  resolveInitialCategoryFromStylePreferences,
  resolveSkinToneForAvatar,
} from '@/features/digital-avatar/utils/avatar-trait.util';
import {
  buildDefaultOutfitFromBlueprint,
  hasAnyOutfitSelection,
} from '@/features/digital-avatar/utils/default-outfit.util';
import { buildLayeredOutfitPayload } from '@/features/digital-avatar/utils/avatar-layer-engine';
import { AvatarStudioViewer } from '@/features/digital-avatar/components/avatar-studio/avatar-studio-viewer';
import { AvatarCreatorModal } from '@/features/digital-avatar/components/avatar-creator/avatar-creator-modal';
import {
  AVATAR_CREATOR_PROVIDERS,
} from '@/features/digital-avatar/constants/avatar-creator.constants';
import { hasCustom3dAvatar, resolveAvatarCreatorProvider } from '@/features/digital-avatar/utils/avatar-creator.util';
import { CategoryTabs } from './category-tabs';
import { ProductSelector } from './product-selector';
import { CurrentOutfitCard } from './current-outfit-card';
import { LookSummary } from './look-summary';
import { Skeleton } from '@/components/ui/skeleton';

function DigitalAvatarSkeleton() {
  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[58fr_42fr]">
        <Skeleton className="min-h-[78vh] rounded-[28px] bg-dashboard-surface" />
        <Skeleton className="min-h-[78vh] rounded-[28px] bg-dashboard-surface" />
      </div>
    </div>
  );
}

export function DigitalAvatarView() {
  const { data: avatar, isLoading } = useAvatarQuery();
  const { data: fashionDna } = useFashionDnaQuery();
  const { data: productsData } = useProductsQuery({ limit: 80 });
  const saveOutfitMutation = useSaveAvatarOutfitMutation();
  const saveLookMutation = useSaveAvatarLookToClosetMutation();
  const updateAvatarMutation = useUpdateAvatarMutation();
  const styleBootstrapRef = useRef(false);
  const defaultOutfitAppliedRef = useRef(false);
  const creatorPromptRef = useRef(false);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [nativeCreatorOpen, setNativeCreatorOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const avatarCreatorProvider = resolveAvatarCreatorProvider();
  const useAvaturnInline = avatarCreatorProvider === AVATAR_CREATOR_PROVIDERS.AVATURN;

  const handleSaveLookToServer = useCallback(
    (payload) => saveOutfitMutation.mutateAsync(payload),
    [saveOutfitMutation],
  );

  const stylePreferences = useMemo(() => {
    if (!avatar?.stylePreferences && !fashionDna?.preferenceTraits) {
      return null;
    }

    const prefs = avatar?.stylePreferences || {};
    const dnaPrefs = fashionDna?.preferenceTraits || {};

    return {
      styleType: prefs.styleType || fashionDna?.styleType || null,
      preferredCategories:
        prefs.preferredCategories
        || dnaPrefs.preferred_categories
        || dnaPrefs.preferredCategories
        || [],
      categoryAffinity:
        prefs.categoryAffinity
        || dnaPrefs.category_affinity
        || dnaPrefs.categoryAffinity
        || {},
      favoriteColors:
        prefs.favoriteColors
        || dnaPrefs.favorite_colors
        || dnaPrefs.favoriteColors
        || [],
      fashionPersonality:
        prefs.fashionPersonality
        || dnaPrefs.fashion_personality
        || dnaPrefs.fashionPersonality
        || null,
    };
  }, [avatar?.stylePreferences, fashionDna?.preferenceTraits, fashionDna?.styleType]);

  const apiProducts = useMemo(
    () => productsData?.items || productsData?.data || [],
    [productsData],
  );

  const {
    catalog,
    activeCategory,
    setActiveCategory,
    outfit,
    skinTone,
    setSkinTone,
    hairColor,
    setHairColor,
    totalValue,
    lastSavedAt,
    hasUnsavedChanges,
    selectProduct,
    unselectCategory,
    handleRandomize,
    handleSaveLook,
    applySuggestedOutfit,
    setOutfit,
  } = useOutfitBuilder({
    apiProducts,
    initialOutfitRecord: avatar?.outfit,
    onSaveLook: handleSaveLookToServer,
  });

  const { suggestOutfit, isSuggesting } = useAiOutfitSuggest({
    catalog,
    onSuggested: applySuggestedOutfit,
  });

  const {
    shopOutfitLook,
    isShopping: isShoppingLook,
    error: shopLookError,
    clearError: clearShopLookError,
  } = useShopOutfitLook();

  useEffect(() => {
    if (!avatar?.id) return;

    const resolvedSkin = resolveSkinToneForAvatar(avatar);
    if (resolvedSkin) {
      setSkinTone(String(resolvedSkin).toLowerCase().replace(/\s+/g, '-'));
    }

    const resolvedHair = resolveHairColorForAvatar(avatar);
    if (resolvedHair) {
      setHairColor(resolvedHair);
    }
  }, [avatar?.hairColor, avatar?.id, avatar?.skinTone, setHairColor, setSkinTone]);

  useEffect(() => {
    if (!avatar?.id || styleBootstrapRef.current) return;

    const initialCategory = resolveInitialCategoryFromStylePreferences(stylePreferences);
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }

    styleBootstrapRef.current = true;
  }, [avatar?.id, setActiveCategory, stylePreferences]);

  useEffect(() => {
    if (!avatar?.id || defaultOutfitAppliedRef.current || hasAnyOutfitSelection(outfit)) {
      return;
    }

    const blueprint = avatar?.generationProfile?.defaultOutfitBlueprint;
    if (!blueprint || !Object.keys(catalog).length) {
      return;
    }

    const suggested = buildDefaultOutfitFromBlueprint(catalog, blueprint);
    if (hasAnyOutfitSelection(suggested)) {
      setOutfit(suggested);
      defaultOutfitAppliedRef.current = true;
    }
  }, [avatar?.generationProfile, avatar?.id, catalog, outfit, setOutfit]);

  useEffect(() => {
    if (!avatar?.id || creatorPromptRef.current || hasCustom3dAvatar(avatar)) {
      return;
    }

    if (avatar?.traitSources?.faceAnalysis || avatar?.generationProfile?.onboardingFaceImageUrl) {
      creatorPromptRef.current = true;

      if (!useAvaturnInline) {
        setNativeCreatorOpen(true);
      }
    }
  }, [avatar, useAvaturnInline]);

  const handleSkinToneChange = useCallback((value) => {
    setSkinTone(value);
    updateAvatarMutation.mutate({ skinTone: value });
  }, [setSkinTone, updateAvatarMutation]);

  const handleHairColorChange = useCallback((value) => {
    setHairColor(value);
    updateAvatarMutation.mutate({ hairColor: value });
  }, [setHairColor, updateAvatarMutation]);

  const handleAvatarExported = useCallback((payload) => {
    updateAvatarMutation.mutate(payload, {
      onSuccess: () => {
        setCreatorOpen(false);
        setNativeCreatorOpen(false);
      },
    });
  }, [updateAvatarMutation]);

  const handleOpenAvatarCreator = useCallback(() => {
    if (useAvaturnInline) {
      setCreatorOpen(true);
      return;
    }

    setNativeCreatorOpen(true);
  }, [useAvaturnInline]);

  const handleFallbackToNativeCreator = useCallback(() => {
    setCreatorOpen(false);
    setNativeCreatorOpen(true);
  }, []);

  const activeTab = CATEGORY_TABS.find((tab) => tab.id === activeCategory) || CATEGORY_TABS[0];
  const categoryProducts = getProductsForCategory(catalog, activeCategory);

  const onSaveLookClick = useCallback(async () => {
    setSaveMessage('');
    try {
      await handleSaveLook();
      const result = await saveLookMutation.mutateAsync({
        outfit: buildLayeredOutfitPayload(outfit),
        totalPrice: totalValue,
        name: `Avatar Look · ${new Date().toLocaleDateString()}`,
      });
      setSaveMessage(result?.savedOutfit?.name
        ? `Saved to Personal Closet: ${result.savedOutfit.name}`
        : 'Look saved to Personal Closet');
    } catch {
      setSaveMessage('');
    }
  }, [handleSaveLook, outfit, saveLookMutation, totalValue]);

  const handleShopLook = useCallback(() => {
    clearShopLookError();
    shopOutfitLook(outfit).catch(() => {});
  }, [clearShopLookError, outfit, shopOutfitLook]);

  if (isLoading) {
    return <DigitalAvatarSkeleton />;
  }

  return (
    <>
      <div className="mx-auto max-w-[1500px]">
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[58fr_42fr]">
          <div className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-20">
            <div className="min-h-[62vh] xl:min-h-[68vh]">
              <AvatarStudioViewer
                model3dUrl={avatar?.model3dUrl}
                bodyType={avatar?.bodyType}
                skinTone={skinTone}
                hairColor={hairColor}
                outfit={outfit}
                generationProfile={avatar?.generationProfile}
                hasCustom3dAvatar={hasCustom3dAvatar(avatar)}
                creatorMode={creatorOpen}
                onAvatarExported={handleAvatarExported}
                onCloseCreator={() => setCreatorOpen(false)}
                onFallbackToNative={handleFallbackToNativeCreator}
                onEditAvatar={handleOpenAvatarCreator}
                isSaving={updateAvatarMutation.isPending}
                className="h-full"
              />
            </div>

            <LookSummary
              totalValue={totalValue}
              outfit={outfit}
              onRandomize={handleRandomize}
              onSaveLook={() => {
                onSaveLookClick().catch(() => {});
              }}
              isBusy={isSuggesting || saveOutfitMutation.isPending || saveLookMutation.isPending}
              isSaved={Boolean(lastSavedAt)}
              hasUnsavedChanges={hasUnsavedChanges}
              lastSavedAt={lastSavedAt}
            />

            {saveMessage ? (
              <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {saveMessage}
              </p>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <CategoryTabs activeCategory={activeCategory} onChange={setActiveCategory} />

            <ProductSelector
              categoryId={activeCategory}
              categoryLabel={activeTab.label}
              products={categoryProducts}
              outfit={outfit}
              onSelect={selectProduct}
              onUnselect={unselectCategory}
            />

            <CurrentOutfitCard
              outfit={outfit}
              totalValue={totalValue}
              onShopLook={handleShopLook}
              isShopping={isShoppingLook}
              shopError={shopLookError}
              className="rounded-[24px] border-white/10 bg-[#111827]"
            />
          </div>
        </div>
      </div>

      <AvatarCreatorModal
        open={nativeCreatorOpen}
        onClose={() => setNativeCreatorOpen(false)}
        avatar={avatar}
        generationProfile={avatar?.generationProfile}
        onAvatarExported={handleAvatarExported}
        isSaving={updateAvatarMutation.isPending}
        provider={AVATAR_CREATOR_PROVIDERS.NATIVE}
      />
    </>
  );
}
