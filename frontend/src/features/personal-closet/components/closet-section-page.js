'use client';

import { useCallback, useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Shirt,
  Sparkles,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import { useAddToWishlistMutation } from '@/features/wishlist/hooks';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BrandCard } from '@/features/personal-closet/components/brand-card';
import { ColorCard } from '@/features/personal-closet/components/color-card';
import { ClosetRecentActivity } from '@/features/personal-closet/components/closet-recent-activity';
import { ClosetSectionBackLayout } from '@/features/personal-closet/components/closet-section-back-layout';
import { OutfitCard } from '@/features/personal-closet/components/outfit-card';
import {
  getProductDetailRoute,
  PurchasedItemCard,
} from '@/features/personal-closet/components/purchased-item-card';
import {
  CLOSET_SECTIONS,
  isClosetSectionId,
} from '@/features/personal-closet/constants/closet-navigation';
import {
  useAddOutfitToCartMutation,
  useDeleteOutfitMutation,
  useFavoriteBrandsQuery,
  useFavoriteColorsQuery,
  usePurchasedItemsQuery,
  useRemoveFavoriteBrandMutation,
  useRemoveFavoriteColorMutation,
  useRemovePurchasedItemMutation,
  useSavedOutfitsQuery,
  useUpdateOutfitMutation,
} from '@/features/personal-closet/hooks/use-closet';
import {
  deriveRecentActivity,
} from '@/features/personal-closet/utils/closet-insights.util';
import { cn } from '@/utils/cn';

function PremiumEmptyState(props) {
  return (
    <EmptyState
      {...props}
      className={cn(
        'rounded-[22px] border border-dashed border-white/[0.08] bg-white/[0.02] p-10',
        props.className,
      )}
    />
  );
}

export function ClosetSectionPage({ sectionId }) {
  if (!isClosetSectionId(sectionId)) {
    notFound();
  }

  const section = CLOSET_SECTIONS[sectionId];
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [wishlistingId, setWishlistingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [deletingOutfitId, setDeletingOutfitId] = useState(null);
  const [addingOutfitId, setAddingOutfitId] = useState(null);
  const [removingBrand, setRemovingBrand] = useState(null);
  const [removingColor, setRemovingColor] = useState(null);
  const [viewingOutfit, setViewingOutfit] = useState(null);

  const purchasedParams = useMemo(
    () => ({
      page,
      limit: sectionId === 'activity' ? 100 : 12,
    }),
    [page, sectionId],
  );

  const needsPurchased = sectionId === 'purchases' || sectionId === 'activity';
  const needsOutfits = sectionId === 'outfits' || sectionId === 'activity';

  const {
    data: purchasedData,
    isLoading: purchasedLoading,
    isError: purchasedError,
    refetch: refetchPurchased,
  } = usePurchasedItemsQuery(purchasedParams);

  const {
    data: outfits = [],
    isLoading: outfitsLoading,
    isError: outfitsError,
    refetch: refetchOutfits,
  } = useSavedOutfitsQuery();

  const {
    data: brands = [],
    isLoading: brandsLoading,
    isError: brandsError,
    refetch: refetchBrands,
  } = useFavoriteBrandsQuery();

  const {
    data: colors = [],
    isLoading: colorsLoading,
    isError: colorsError,
    refetch: refetchColors,
  } = useFavoriteColorsQuery();

  const addToWishlist = useAddToWishlistMutation();
  const removePurchased = useRemovePurchasedItemMutation();
  const deleteOutfit = useDeleteOutfitMutation();
  const updateOutfit = useUpdateOutfitMutation();
  const addOutfitToCart = useAddOutfitToCartMutation();
  const removeBrand = useRemoveFavoriteBrandMutation();
  const removeColor = useRemoveFavoriteColorMutation();

  const purchasedItems = purchasedData?.items ?? [];
  const meta = purchasedData?.meta ?? { page: 1, totalPages: 1, total: 0 };

  const allRecentActivity = useMemo(
    () => deriveRecentActivity(outfits, purchasedItems, null),
    [outfits, purchasedItems],
  );

  const handleWishlist = useCallback(async (item) => {
    setWishlistingId(item.id);
    try {
      await addToWishlist.mutateAsync(item.productId);
    } finally {
      setWishlistingId(null);
    }
  }, [addToWishlist]);

  const handleRemovePurchased = useCallback(async (item) => {
    setRemovingId(item.id);
    try {
      await removePurchased.mutateAsync({
        orderId: item.orderId,
        productId: item.productId,
      });
    } finally {
      setRemovingId(null);
    }
  }, [removePurchased]);

  const handleDeleteOutfit = useCallback(async (outfit) => {
    setDeletingOutfitId(outfit.id);
    try {
      await deleteOutfit.mutateAsync(outfit.id);
      if (viewingOutfit?.id === outfit.id) {
        setViewingOutfit(null);
      }
    } finally {
      setDeletingOutfitId(null);
    }
  }, [deleteOutfit, viewingOutfit]);

  const handleAddOutfitToCart = useCallback(async (outfit) => {
    setAddingOutfitId(outfit.id);
    try {
      await addOutfitToCart.mutateAsync(outfit.id);
      router.push(ROUTES.CART);
    } finally {
      setAddingOutfitId(null);
    }
  }, [addOutfitToCart, router]);

  const handleShareOutfit = useCallback(async (outfit) => {
    const text = `${outfit.name} — ${outfit.productCount || outfit.items?.length || 0} items from my Wardrobe AI closet`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: outfit.name, text });
        return;
      } catch {
        // fall through
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  }, []);

  const isError = purchasedError || outfitsError || brandsError || colorsError;

  if (isError) {
    return (
      <ClosetSectionBackLayout
        title={section.title}
        description={section.description}
        backTab={section.tab}
      >
        <ErrorState
          title={`Could not load ${section.title.toLowerCase()}`}
          description="We had trouble fetching your wardrobe data."
          onRetry={() => {
            if (needsPurchased) refetchPurchased();
            if (needsOutfits) refetchOutfits();
            if (sectionId === 'brands') refetchBrands();
            if (sectionId === 'colors') refetchColors();
          }}
        />
      </ClosetSectionBackLayout>
    );
  }

  const isLoading = (
    (needsPurchased && purchasedLoading)
    || (needsOutfits && outfitsLoading)
    || (sectionId === 'brands' && brandsLoading)
    || (sectionId === 'colors' && colorsLoading)
  );

  return (
    <ClosetSectionBackLayout
      title={section.title}
      description={section.description}
      backTab={section.tab}
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-[22px] bg-white/5" />
          <Skeleton className="h-32 rounded-[22px] bg-white/5" />
        </div>
      ) : null}

      {!isLoading && sectionId === 'activity' ? (
        <ClosetRecentActivity activities={allRecentActivity} />
      ) : null}

      {!isLoading && sectionId === 'outfits' ? (
        !outfits.length ? (
          <PremiumEmptyState
            icon={Sparkles}
            title="Save outfits from Digital Avatar or Virtual Try-On."
            description="Build a look, save it, and it will show up here with price and item count."
            actionLabel="Open Virtual Try-On"
            onAction={() => router.push(ROUTES.AI.VIRTUAL_TRY_ON)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {outfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                onView={setViewingOutfit}
                onEdit={(id, body) => updateOutfit.mutateAsync({ id, ...body })}
                onAddToCart={handleAddOutfitToCart}
                onShare={handleShareOutfit}
                onDelete={handleDeleteOutfit}
                isAddingToCart={addingOutfitId === outfit.id}
                isDeleting={deletingOutfitId === outfit.id}
              />
            ))}
          </div>
        )
      ) : null}

      {!isLoading && sectionId === 'purchases' ? (
        !purchasedItems.length ? (
          <PremiumEmptyState
            icon={Shirt}
            title="Your wardrobe is waiting for its first purchase."
            description="Once an order is delivered, your items will appear here automatically."
            actionLabel="Shop products"
            onAction={() => router.push(ROUTES.PRODUCTS.LIST)}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {purchasedItems.map((item) => (
                <PurchasedItemCard
                  key={item.id}
                  item={item}
                  onView={() => router.push(getProductDetailRoute(item.productId))}
                  onWishlist={handleWishlist}
                  onAddToOutfit={() => router.push(ROUTES.AI.VIRTUAL_TRY_ON)}
                  onRemove={handleRemovePurchased}
                  isWishlisting={wishlistingId === item.id}
                  isRemoving={removingId === item.id}
                />
              ))}
            </div>

            {meta.totalPages > 1 ? (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06]"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <span className="text-sm text-white/50">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06]"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : null}
          </>
        )
      ) : null}

      {!isLoading && sectionId === 'brands' ? (
        !brands.length ? (
          <p className="rounded-[22px] border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center text-sm text-white/45">
            No brand preferences yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((item) => (
              <BrandCard
                key={item.id}
                brand={item}
                onBrowse={(row) => router.push(`${ROUTES.PRODUCTS.LIST}?brand=${encodeURIComponent(row.brandName)}`)}
                onRemove={async (row) => {
                  setRemovingBrand(row.brandName);
                  try {
                    await removeBrand.mutateAsync(row.brandName);
                  } finally {
                    setRemovingBrand(null);
                  }
                }}
                isRemoving={removingBrand === item.brandName}
              />
            ))}
          </div>
        )
      ) : null}

      {!isLoading && sectionId === 'colors' ? (
        !colors.length ? (
          <p className="rounded-[22px] border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center text-sm text-white/45">
            No color trends detected yet.
          </p>
        ) : (
          <div className="grid gap-3 lg:max-w-3xl">
            {colors.map((item) => (
              <ColorCard
                key={item.id}
                color={item}
                outfitCount={Math.max(0, Math.round((item.usagePercent || 0) / 12))}
                onRemove={async (row) => {
                  setRemovingColor(row.colorName);
                  try {
                    await removeColor.mutateAsync(row.colorName);
                  } finally {
                    setRemovingColor(null);
                  }
                }}
                isRemoving={removingColor === item.colorName}
              />
            ))}
          </div>
        )
      ) : null}

      {viewingOutfit ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[22px] border border-white/[0.08] bg-[#141B2D] p-6 shadow-[0_0_60px_rgba(124,58,237,0.2)]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A855F7]">
                  Outfit Details
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {viewingOutfit.name}
                </h3>
                <p className="text-sm text-white/50">
                  {viewingOutfit.productCount || viewingOutfit.items?.length || 0} items
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl border border-white/[0.08] p-2 text-white/60 hover:bg-white/[0.04] hover:text-white"
                aria-label="Close outfit details"
                onClick={() => setViewingOutfit(null)}
              >
                <X className="size-4" />
              </button>
            </div>
            <ul className="space-y-2">
              {(viewingOutfit.items || []).map((product, index) => (
                <li
                  key={product.id || product.productId || index}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/80"
                >
                  <span className="font-medium text-white">
                    {product.name || product.productName || 'Product'}
                  </span>
                  {product.brand ? (
                    <span className="text-white/45"> · {product.brand}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      ) : null}
    </ClosetSectionBackLayout>
  );
}
