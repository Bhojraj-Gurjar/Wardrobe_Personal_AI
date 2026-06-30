'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ErrorState } from '@/components/shared/error-state';
import { useAuthHydrated } from '@/features/auth/hooks/use-auth-hydrated';
import { useSession } from '@/features/auth/components/session-provider';
import { resolveVirtualTryOnBodyPhotoUrl } from '@/features/body-analysis/utils/resolve-body-photo-url';
import { useBodyAnalysisQuery } from '@/features/body-analysis/hooks/use-body-analysis';
import { withCacheBust } from '@/features/profile/utils/profile-helpers';
import { useProfileQuery } from '@/features/profile/hooks/use-profile';
import { useAuthStore } from '@/stores/auth-store';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAddTryOnResultToClosetMutation,
  useDeleteTryOnResultMutation,
  useGenerateVirtualTryOnMutation,
  useSaveTryOnResultOutfitMutation,
  useVirtualTryOnProductsQuery,
  useVirtualTryOnResultsQuery,
  useVirtualTryOnSetupQuery,
  VIRTUAL_TRY_ON_SETUP_KEY,
} from '../hooks/use-virtual-try-on';
import { useVirtualTryOnSession } from '../hooks/use-virtual-try-on-session';
import { NO_BODY_IMAGE_MESSAGE } from '../constants/virtual-try-on.constants';
import {
  clearVirtualTryOnSessionPhoto,
  uploadTemporaryBodyPhoto,
} from '../services/virtual-try-on.service';
import {
  describeClientTryOnMode,
  getSelectedOutfitProductIds,
  inferClientTryOnMode,
  resolveOutfitSelectionFromProducts,
  toggleOutfitSlotSelection,
} from '../utils/outfit-selection.util';
import { mapVirtualTryOnClientError, stripSessionPhotoCacheParams } from '../utils/try-on-image.util';
import {
  coerceResultIdMap,
  coerceTryOnHistoryResults,
  logVirtualTryOnError,
} from '../utils/virtual-try-on-guards.util';
import { VTO_LOADING_PHASES } from '../styles/virtual-try-on-tokens';
import { UploadPanel } from './upload/upload-panel';
import { OutfitCarousel } from './outfit/outfit-carousel';
import { PreviewPanel } from './preview/preview-panel';
import { TryOnHistory } from './try-on-history';

export function VirtualTryOnView() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const { session, updateSession } = useVirtualTryOnSession();

  const [isUploadingBody, setIsUploadingBody] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingPhase, setLoadingPhase] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingToCloset, setIsAddingToCloset] = useState(false);
  const [busyHistoryId, setBusyHistoryId] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  const sessionHydratedRef = useRef(false);
  const previewBlobRef = useRef(null);

  const {
    selectedProductId,
    selectedOutfitSlots,
    activeCategory,
    search,
    compatibleOnly,
    temporaryBodyPhotoUrl,
    useSessionPhoto,
    sessionPhotoRevision,
    latestResult,
    savedResultIds,
    closetResultIds,
    tryOnMode,
    tryOnModeLabel,
  } = session ?? {};

  const { data: setup, isFetching: isSetupFetching, isError: isSetupError, error: setupError, isFetched: isSetupFetched, refetch: refetchSetup } = useVirtualTryOnSetupQuery();
  const authHydrated = useAuthHydrated();
  const { isVerified } = useSession();
  const { data: profile } = useProfileQuery();
  const { data: bodyAnalysis } = useBodyAnalysisQuery();
  const { data: historyData, isLoading: isHistoryLoading } = useVirtualTryOnResultsQuery();

  const productQueryParams = useMemo(
    () => ({
      page: 1,
      limit: 48,
      category: activeCategory || undefined,
      search: (search || '').trim() || undefined,
      compatibleOnly,
    }),
    [activeCategory, search, compatibleOnly],
  );

  const { data: productsData, isLoading: isProductsLoading } = useVirtualTryOnProductsQuery(
    productQueryParams,
  );

  const generateMutation = useGenerateVirtualTryOnMutation();
  const saveOutfitMutation = useSaveTryOnResultOutfitMutation();
  const addToClosetMutation = useAddTryOnResultToClosetMutation();
  const deleteResultMutation = useDeleteTryOnResultMutation();

  const products = useMemo(
    () => (Array.isArray(productsData?.products) ? productsData.products : []),
    [productsData?.products],
  );

  const historyResults = useMemo(
    () => coerceTryOnHistoryResults(historyData),
    [historyData],
  );

  const safeSavedResultIds = useMemo(
    () => coerceResultIdMap(savedResultIds),
    [savedResultIds],
  );

  const safeClosetResultIds = useMemo(
    () => coerceResultIdMap(closetResultIds),
    [closetResultIds],
  );

  const selectedOutfitItems = useMemo(
    () => resolveOutfitSelectionFromProducts(products, selectedOutfitSlots || {}),
    [products, selectedOutfitSlots],
  );

  const selectedProductIds = useMemo(
    () => getSelectedOutfitProductIds(selectedOutfitSlots || {}),
    [selectedOutfitSlots],
  );

  const inferredTryOnMode = useMemo(
    () => inferClientTryOnMode(selectedOutfitSlots || {}, products),
    [products, selectedOutfitSlots],
  );

  const selectedProduct = useMemo(() => {
    if (selectedOutfitItems.length === 1) {
      return selectedOutfitItems[0].product;
    }

    return products.find((product) => String(product.id) === String(selectedProductId)) || null;
  }, [products, selectedOutfitItems, selectedProductId]);

  const revokeLocalPreview = useCallback(() => {
    if (previewBlobRef.current) {
      URL.revokeObjectURL(previewBlobRef.current);
      previewBlobRef.current = null;
    }

    setLocalPreviewUrl(null);
  }, []);

  useEffect(() => () => {
    if (previewBlobRef.current) {
      URL.revokeObjectURL(previewBlobRef.current);
    }
  }, []);

  useEffect(() => {
    if (!setup || sessionHydratedRef.current) {
      return;
    }

    if (setup.sessionPhotoActive && setup.sessionBodyPhotoUrl && !temporaryBodyPhotoUrl) {
      updateSession({
        temporaryBodyPhotoUrl: stripSessionPhotoCacheParams(setup.sessionBodyPhotoUrl),
        useSessionPhoto: true,
        sessionPhotoRevision: sessionPhotoRevision || Date.now(),
      });
    }

    sessionHydratedRef.current = true;
  }, [setup, temporaryBodyPhotoUrl, updateSession]);

  useEffect(() => {
    if (!latestResult?.result?.id || !Array.isArray(historyResults) || !historyResults.length) {
      return;
    }

    const refreshed = historyResults.find((item) => item.id === latestResult.result.id);

    if (
      refreshed
      && refreshed.generatedImageUrl
      && refreshed.generatedImageUrl !== latestResult.generatedImageUrl
    ) {
      updateSession({
        latestResult: {
          ...latestResult,
          generatedImageUrl: refreshed.generatedImageUrl,
          result: refreshed,
        },
      });
    }
  }, [historyResults, latestResult, updateSession]);

  useEffect(() => {
    if (latestResult?.generatedImageUrl || generateMutation.isPending || !Array.isArray(historyResults)) {
      return;
    }

    const newest = historyResults[0];

    if (!newest?.generatedImageUrl) {
      return;
    }

    if (selectedProductId && newest.productId && newest.productId !== selectedProductId) {
      return;
    }

    updateSession({
      latestResult: {
        bodyPhotoUrl: newest.bodyPhotoUrl || null,
        generatedImageUrl: newest.generatedImageUrl,
        result: newest,
      },
      selectedProductId: newest.productId || selectedProductId,
      pendingProductId: null,
    });
  }, [
    generateMutation.isPending,
    historyResults,
    latestResult?.generatedImageUrl,
    selectedProductId,
    updateSession,
  ]);

  useEffect(() => {
    if (!generateMutation.isPending) {
      setLoadingPhase('');
      setLoadingProgress(0);
      return undefined;
    }

    let phaseIndex = 0;
    let progress = 8;
    setLoadingPhase(VTO_LOADING_PHASES[0]);
    setLoadingProgress(progress);

    const phaseInterval = setInterval(() => {
      phaseIndex = Math.min(phaseIndex + 1, VTO_LOADING_PHASES.length - 1);
      setLoadingPhase(VTO_LOADING_PHASES[phaseIndex]);
    }, 3500);

    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 6, 94);
      setLoadingProgress(progress);
    }, 1200);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
    };
  }, [generateMutation.isPending]);

  const bodyPhotoUrl = useMemo(() => {
    if (localPreviewUrl) {
      return localPreviewUrl;
    }

    const resolved = resolveVirtualTryOnBodyPhotoUrl({
      setup,
      profile,
      bodyAnalysis,
      temporaryBodyPhotoUrl: useSessionPhoto ? temporaryBodyPhotoUrl : null,
    });

    if (useSessionPhoto && temporaryBodyPhotoUrl) {
      return withCacheBust(
        temporaryBodyPhotoUrl,
        sessionPhotoRevision || temporaryBodyPhotoUrl,
      );
    }

    if (!resolved || useSessionPhoto) {
      return resolved || temporaryBodyPhotoUrl;
    }

    return withCacheBust(
      resolved,
      bodyAnalysis?.updated_at || bodyAnalysis?.updatedAt || profile?.updated_at,
    );
  }, [
    setup,
    profile,
    bodyAnalysis,
    temporaryBodyPhotoUrl,
    useSessionPhoto,
    sessionPhotoRevision,
    localPreviewUrl,
  ]);

  const bodyPhotoPreviewKey = localPreviewUrl
    || sessionPhotoRevision
    || temporaryBodyPhotoUrl
    || bodyPhotoUrl;

  const usingTemporaryPhoto = Boolean(useSessionPhoto && temporaryBodyPhotoUrl);
  const isSaved = Boolean(
    latestResult?.result?.id && safeSavedResultIds[latestResult.result.id],
  );
  const addedToCloset = Boolean(
    latestResult?.result?.id && safeClosetResultIds[latestResult.result.id],
  );

  useEffect(() => {
    if (isProductsLoading) {
      return;
    }

    if (productsData?.meta?.compatibleFallbackApplied) {
      updateSession({ compatibleOnly: false });
      return;
    }

    if (
      compatibleOnly
      && products.length === 0
      && !(search || '').trim()
      && !activeCategory
    ) {
      updateSession({ compatibleOnly: false });
    }
  }, [
    isProductsLoading,
    compatibleOnly,
    products.length,
    search,
    activeCategory,
    productsData?.meta?.compatibleFallbackApplied,
    updateSession,
  ]);

  const runTryOn = useCallback(async (productIds = selectedProductIds) => {
    if (generateMutation.isPending) {
      return;
    }

    const ids = productIds?.length
      ? productIds
      : selectedProduct?.id
        ? [selectedProduct.id]
        : [];

    if (!ids.length) {
      return;
    }

    setErrorMessage('');
    updateSession({
      pendingProductId: ids[0],
      selectedProductId: ids[0],
      latestResult: null,
      tryOnMode: inferClientTryOnMode(selectedOutfitSlots || {}, products),
      tryOnModeLabel: describeClientTryOnMode(
        inferClientTryOnMode(selectedOutfitSlots || {}, products),
      ),
      savedResultIds: {
        ...safeSavedResultIds,
      },
    });

    try {
      const response = await generateMutation.mutateAsync({
        productIds: ids,
        productId: ids.length === 1 ? ids[0] : undefined,
        temporaryBodyImageUrl: usingTemporaryPhoto
          ? stripSessionPhotoCacheParams(temporaryBodyPhotoUrl)
          : undefined,
      });

      const nextResult = {
        bodyPhotoUrl: response.bodyPhotoUrl || bodyPhotoUrl,
        generatedImageUrl: response.generatedImageUrl || response.result?.generatedImageUrl,
        result: response.result,
      };

      updateSession({
        latestResult: nextResult,
        pendingProductId: null,
        selectedProductId: ids[0],
        tryOnMode: response.tryOnMode || inferClientTryOnMode(selectedOutfitSlots || {}, products),
        tryOnModeLabel: response.tryOnModeLabel
          || describeClientTryOnMode(response.tryOnMode || inferredTryOnMode),
      });

      if (response.skippedProducts?.length) {
        const skippedMessage = response.skippedProducts
          .map((item) => item.reason || item.name)
          .filter(Boolean)
          .join(' ');

        if (skippedMessage) {
          setErrorMessage(skippedMessage);
        } else {
          setErrorMessage('');
        }
      } else {
        setErrorMessage('');
      }
    } catch (error) {
      updateSession({ pendingProductId: null });
      logVirtualTryOnError('generate', error, { productIds: ids });
      setErrorMessage(
        mapVirtualTryOnClientError(error)
          || 'Something went wrong while generating your Virtual Try-On. Please try again.',
      );
    }
  }, [
    bodyPhotoUrl,
    generateMutation,
    inferredTryOnMode,
    products,
    safeSavedResultIds,
    selectedOutfitSlots,
    selectedProduct?.id,
    selectedProductIds,
    temporaryBodyPhotoUrl,
    updateSession,
    usingTemporaryPhoto,
  ]);

  const handleTryOn = () => {
    runTryOn(selectedProductIds);
  };

  const handleSelectProduct = (product) => {
    if (!product?.id) {
      return;
    }

    const nextSlots = toggleOutfitSlotSelection(selectedOutfitSlots || {}, product);

    updateSession({
      selectedOutfitSlots: nextSlots,
      selectedProductId: product.id,
      tryOnMode: inferClientTryOnMode(nextSlots, products),
      tryOnModeLabel: describeClientTryOnMode(inferClientTryOnMode(nextSlots, products)),
    });
  };

  const handleUploadTemporaryPhoto = async (file) => {
    if (!token || !file) {
      return;
    }

    revokeLocalPreview();

    const blobUrl = URL.createObjectURL(file);
    previewBlobRef.current = blobUrl;
    setLocalPreviewUrl(blobUrl);

    setIsUploadingBody(true);
    setUploadError('');
    setErrorMessage('');
    updateSession({ latestResult: null });

    try {
      const url = await uploadTemporaryBodyPhoto(file, token);
      const canonicalUrl = stripSessionPhotoCacheParams(url);
      const revision = Date.now();

      revokeLocalPreview();

      updateSession({
        temporaryBodyPhotoUrl: canonicalUrl,
        useSessionPhoto: true,
        sessionPhotoRevision: revision,
        latestResult: null,
      });
      await queryClient.invalidateQueries({ queryKey: VIRTUAL_TRY_ON_SETUP_KEY });
    } catch (error) {
      logVirtualTryOnError('upload-temporary-photo', error);
      setUploadError(error?.message || 'Could not upload temporary photo.');
    } finally {
      setIsUploadingBody(false);
    }
  };

  const handleUseOnboardingPhoto = async () => {
    setUploadError('');
    setErrorMessage('');
    revokeLocalPreview();

    if (token && useSessionPhoto) {
      try {
        await clearVirtualTryOnSessionPhoto(token);
      } catch {
        // Server clear is best-effort; local session still resets below.
      }
    }

    updateSession({
      temporaryBodyPhotoUrl: null,
      useSessionPhoto: false,
      sessionPhotoRevision: null,
      latestResult: null,
    });
    await queryClient.invalidateQueries({ queryKey: VIRTUAL_TRY_ON_SETUP_KEY });
  };

  const handleSaveLook = async () => {
    if (!latestResult?.result?.id) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      await saveOutfitMutation.mutateAsync({
        resultId: latestResult.result.id,
        name: `Saved Look · ${selectedProduct?.name || 'Outfit'}`,
      });
      updateSession({
        savedResultIds: {
          ...safeSavedResultIds,
          [latestResult.result.id]: true,
        },
      });
    } catch (error) {
      logVirtualTryOnError('save-look', error, { resultId: latestResult.result.id });
      setErrorMessage(error?.message || 'Could not save look.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToCloset = async () => {
    if (!latestResult?.result?.id) {
      return;
    }

    setIsAddingToCloset(true);
    setErrorMessage('');

    try {
      await addToClosetMutation.mutateAsync(latestResult.result.id);
      updateSession({
        closetResultIds: {
          ...safeClosetResultIds,
          [latestResult.result.id]: true,
        },
      });
    } catch (error) {
      logVirtualTryOnError('add-to-closet', error, { resultId: latestResult.result.id });
      setErrorMessage(error?.message || 'Could not add outfit to closet.');
    } finally {
      setIsAddingToCloset(false);
    }
  };

  const handleHistorySaveOutfit = async (result) => {
    if (!result?.id) {
      return;
    }

    setBusyHistoryId(result.id);
    try {
      await saveOutfitMutation.mutateAsync({
        resultId: result.id,
        name: `Saved Look · ${result.productName || 'Outfit'}`,
      });
      updateSession({
        savedResultIds: {
          ...safeSavedResultIds,
          [result.id]: true,
        },
      });
    } catch (error) {
      logVirtualTryOnError('history-save-outfit', error, { resultId: result.id });
    } finally {
      setBusyHistoryId(null);
    }
  };

  const handleHistoryAddToCloset = async (result) => {
    if (!result?.id) {
      return;
    }

    setBusyHistoryId(result.id);
    try {
      await addToClosetMutation.mutateAsync(result.id);
      updateSession({
        closetResultIds: {
          ...safeClosetResultIds,
          [result.id]: true,
        },
      });
    } catch (error) {
      logVirtualTryOnError('history-add-to-closet', error, { resultId: result.id });
    } finally {
      setBusyHistoryId(null);
    }
  };

  const handleHistoryDelete = async (resultId) => {
    if (!resultId) {
      return;
    }

    setBusyHistoryId(resultId);
    try {
      await deleteResultMutation.mutateAsync(resultId);

      if (latestResult?.result?.id === resultId) {
        updateSession({ latestResult: null });
      }
    } finally {
      setBusyHistoryId(null);
    }
  };

  const isAnalyzing = generateMutation.isPending;
  const isBootstrapping = !authHydrated
    || (Boolean(token) && !isVerified)
    || (Boolean(token) && isVerified && !isSetupFetched && isSetupFetching);

  if (isBootstrapping) {
    return (
      <div className="-mx-4 -mt-2 min-h-[80vh] bg-[#090B18] px-4 py-6 md:-mx-6 lg:-mx-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="h-10 w-72 animate-pulse rounded-xl bg-white/5" />
          <div className="grid gap-5 md:grid-cols-[2fr_3fr]">
            <div className="space-y-5">
              <div className="h-72 animate-pulse rounded-[20px] bg-white/5" />
              <div className="h-64 animate-pulse rounded-[20px] bg-white/5" />
            </div>
            <div className="min-h-[640px] animate-pulse rounded-[20px] bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (isSetupError) {
    return (
      <div className="-mx-4 -mt-2 min-h-[80vh] bg-[#090B18] px-4 py-6 md:-mx-6 lg:-mx-8">
        <div className="mx-auto max-w-2xl pt-12">
          <ErrorState
            title="Unable to load Virtual Try-On"
            description={setupError?.message || 'Please check your connection and try again.'}
            onRetry={() => refetchSetup()}
          />
        </div>
      </div>
    );
  }

  if (!setup?.ready && !bodyPhotoUrl) {
    return (
      <div className="-mx-4 -mt-2 flex min-h-[80vh] items-center justify-center bg-[#090B18] px-4 py-6 md:-mx-6 lg:-mx-8">
        <div className="mx-auto max-w-md rounded-[20px] border border-white/[0.08] bg-[#141B2D] p-8 text-center shadow-[0_0_48px_rgba(124,58,237,0.1)]">
          <Sparkles className="mx-auto mb-4 size-10 text-[#A855F7]" />
          <h2 className="text-2xl font-bold text-white">Virtual Try-On</h2>
          <p className="mt-3 text-sm text-white/50">
            {setup?.message || NO_BODY_IMAGE_MESSAGE}
          </p>
          <Link
            href={ROUTES.ONBOARDING.PROFILE}
            className="mt-6 inline-flex rounded-2xl border border-white/[0.08] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.04]"
          >
            Complete Onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mt-2 min-h-[80vh] bg-[#090B18] px-4 py-6 pb-32 md:-mx-6 md:pb-6 lg:-mx-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A855F7]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI Technology
          </p>
          <h1 className="text-3xl font-bold text-white">Virtual Try-On</h1>
          <p className="max-w-2xl text-sm text-white/50">
            Mix tops, bottoms, and jackets — we automatically apply upper-body, lower-body, or full-outfit try-on.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)]">
          <div className="order-2 flex flex-col gap-5 lg:order-1">
            <UploadPanel
              bodyPhotoUrl={bodyPhotoUrl}
              previewKey={bodyPhotoPreviewKey}
              usingTemporaryPhoto={usingTemporaryPhoto || Boolean(localPreviewUrl)}
              isUploading={isUploadingBody}
              uploadError={uploadError}
              onUpload={handleUploadTemporaryPhoto}
              onRemove={handleUseOnboardingPhoto}
              onUseOnboardingPhoto={handleUseOnboardingPhoto}
            />
            <OutfitCarousel
              products={products}
              isLoading={isProductsLoading}
              selectedProductId={selectedProduct?.id}
              selectedOutfitSlots={selectedOutfitSlots}
              selectedOutfitItems={selectedOutfitItems}
              activeCategory={activeCategory}
              search={search}
              compatibleOnly={compatibleOnly}
              tryOnModeLabel={tryOnModeLabel || describeClientTryOnMode(inferredTryOnMode)}
              onCategoryChange={(value) => updateSession({ activeCategory: value })}
              onSearchChange={(value) => updateSession({ search: value })}
              onCompatibleOnlyChange={(value) => updateSession({ compatibleOnly: value })}
              onSelectProduct={handleSelectProduct}
            />
          </div>

          <div className="order-1 lg:order-2">
            <PreviewPanel
              bodyPhotoUrl={bodyPhotoUrl}
              generatedImageUrl={latestResult?.generatedImageUrl}
              selectedProduct={selectedProduct}
              selectedOutfitItems={selectedOutfitItems}
              tryOnModeLabel={tryOnModeLabel || describeClientTryOnMode(inferredTryOnMode)}
              isGenerating={isAnalyzing}
              loadingPhase={loadingPhase}
              loadingProgress={loadingProgress}
              isSaving={isSaving}
              isSaved={isSaved}
              isAddingToCloset={isAddingToCloset}
              addedToCloset={addedToCloset}
              errorMessage={errorMessage}
              onTryOn={handleTryOn}
              onSaveLook={handleSaveLook}
              onRegenerate={handleTryOn}
              onAddToCloset={handleAddToCloset}
              canTryOn={selectedProductIds.length > 0}
            />
          </div>
        </div>

        <TryOnHistory
          results={Array.isArray(historyResults) ? historyResults : []}
          isLoading={isHistoryLoading}
          busyResultId={busyHistoryId}
          savedResultIds={safeSavedResultIds}
          closetResultIds={safeClosetResultIds}
          onSaveOutfit={handleHistorySaveOutfit}
          onAddToCloset={handleHistoryAddToCloset}
          onDelete={handleHistoryDelete}
        />
      </div>
    </div>
  );
}
