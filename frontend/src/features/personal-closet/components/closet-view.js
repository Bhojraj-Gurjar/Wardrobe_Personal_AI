'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  Shirt,
  Sparkles,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import { useAddToWishlistMutation } from '@/features/wishlist/hooks';
import { useProfileQuery } from '@/features/profile/hooks/use-profile';
import { useUserProfile } from '@/stores/auth-store';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { BrandCard } from '@/features/personal-closet/components/brand-card';
import { ColorCard } from '@/features/personal-closet/components/color-card';
import { ClosetOverviewCards } from '@/features/personal-closet/components/closet-overview-cards';
import { ClosetSearchBar } from '@/features/personal-closet/components/closet-search-bar';
import { ClosetQuickActions } from '@/features/personal-closet/components/closet-quick-actions';
import { ClosetInsightsPanel } from '@/features/personal-closet/components/closet-insights-panel';
import { ClosetRecentActivity } from '@/features/personal-closet/components/closet-recent-activity';
import { ClosetSectionHeader } from '@/features/personal-closet/components/closet-section-header';
import { ClosetTabNav } from '@/features/personal-closet/components/closet-tab-nav';
import { OutfitCard } from '@/features/personal-closet/components/outfit-card';
import {
  getProductDetailRoute,
  PurchasedItemCard,
} from '@/features/personal-closet/components/purchased-item-card';
import {
  CLOSET_PREVIEW_LIMIT,
  CLOSET_TABS,
  getClosetSectionHref,
} from '@/features/personal-closet/constants/closet-navigation';
import {
  useAddOutfitToCartMutation,
  useClosetOverviewQuery,
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
  deriveAverageOutfitMatch,
  deriveClosetInsights,
  deriveClosetValue,
  deriveLastUpdated,
  deriveRecentActivity,
  filterOutfitByOccasion,
  filterOutfitBySeason,
} from '@/features/personal-closet/utils/closet-insights.util';
import { cn } from '@/utils/cn';

function ClosetSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Skeleton className="h-40 rounded-[22px] bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-[22px] bg-white/5" />
        ))}
      </div>
      <Skeleton className="h-28 rounded-[22px] bg-white/5" />
      <Skeleton className="h-48 rounded-[22px] bg-white/5" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[3/4] rounded-[22px] bg-white/5" />
        ))}
      </div>
    </div>
  );
}

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

export function ClosetView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authUser = useUserProfile();
  const { data: profile } = useProfileQuery();

  const activeTab = searchParams.get('tab') === CLOSET_TABS.PREFERENCES
    ? CLOSET_TABS.PREFERENCES
    : CLOSET_TABS.WARDROBE;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [recentlyAdded, setRecentlyAdded] = useState(false);
  const [occasion, setOccasion] = useState('');
  const [season, setSeason] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [wishlistingId, setWishlistingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [deletingOutfitId, setDeletingOutfitId] = useState(null);
  const [addingOutfitId, setAddingOutfitId] = useState(null);
  const [removingBrand, setRemovingBrand] = useState(null);
  const [removingColor, setRemovingColor] = useState(null);
  const [viewingOutfit, setViewingOutfit] = useState(null);

  const userName = profile?.full_name
    || profile?.name
    || authUser?.name
    || authUser?.fullName
    || 'Raj';

  const purchasedParams = useMemo(
    () => ({
      page,
      limit: 12,
      search: search || undefined,
      category: category || undefined,
      brand: brand || undefined,
      color: color || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      sort: recentlyAdded ? 'latest' : 'latest',
    }),
    [page, search, category, brand, color, minPrice, maxPrice, recentlyAdded],
  );

  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    refetch: refetchOverview,
  } = useClosetOverviewQuery();

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
    refetch: refetchBrands,
  } = useFavoriteBrandsQuery();

  const {
    data: colors = [],
    isLoading: colorsLoading,
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

  const clearFilters = useCallback(() => {
    setSearch('');
    setCategory('');
    setBrand('');
    setColor('');
    setMinPrice('');
    setMaxPrice('');
    setRecentlyAdded(false);
    setOccasion('');
    setSeason('');
    setSortBy('latest');
    setPage(1);
  }, []);

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
        // fall through to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  }, []);

  const handleExportCloset = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      overview,
      outfits,
      brands,
      colors,
      purchasedItems: purchasedItems.slice(0, 50),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'wardrobe-closet-export.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [overview, outfits, brands, colors, purchasedItems]);

  const filteredOutfits = useMemo(() => {
    const term = search.trim().toLowerCase();

    let results = outfits.filter((outfit) => {
      const matchesSearch = !term || outfit.name?.toLowerCase().includes(term);
      const matchesOccasion = filterOutfitByOccasion(outfit, occasion);
      const matchesSeason = filterOutfitBySeason(outfit, season);
      return matchesSearch && matchesOccasion && matchesSeason;
    });

    if (sortBy === 'name') {
      results = [...results].sort((a, b) => String(a.name).localeCompare(String(b.name)));
    } else if (sortBy === 'value') {
      results = [...results].sort((a, b) => (Number(b.totalPrice) || 0) - (Number(a.totalPrice) || 0));
    } else {
      results = [...results].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
    }

    return results;
  }, [outfits, search, occasion, season, sortBy]);

  const filteredBrands = useMemo(() => {
    const term = search.trim().toLowerCase();
    const brandFilter = brand.trim().toLowerCase();
    return brands.filter((item) => {
      const matchesSearch = !term || item.brandName.toLowerCase().includes(term);
      const matchesBrand = !brandFilter || item.brandName.toLowerCase().includes(brandFilter);
      return matchesSearch && matchesBrand;
    });
  }, [brands, search, brand]);

  const filteredColors = useMemo(() => {
    const colorFilter = color.trim().toLowerCase();
    if (!colorFilter) {
      return colors;
    }
    return colors.filter((item) => item.colorName.toLowerCase().includes(colorFilter));
  }, [colors, color]);

  const visiblePurchasedItems = useMemo(
    () => purchasedItems.slice(0, CLOSET_PREVIEW_LIMIT),
    [purchasedItems],
  );

  const visibleOutfits = useMemo(
    () => filteredOutfits.slice(0, CLOSET_PREVIEW_LIMIT),
    [filteredOutfits],
  );

  const previewBrands = useMemo(
    () => filteredBrands.slice(0, CLOSET_PREVIEW_LIMIT),
    [filteredBrands],
  );

  const previewColors = useMemo(
    () => filteredColors.slice(0, CLOSET_PREVIEW_LIMIT),
    [filteredColors],
  );

  const allRecentActivity = useMemo(
    () => deriveRecentActivity(outfits, purchasedItems, null),
    [outfits, purchasedItems],
  );

  const previewRecentActivity = useMemo(
    () => allRecentActivity.slice(0, CLOSET_PREVIEW_LIMIT),
    [allRecentActivity],
  );

  const closetValue = useMemo(
    () => deriveClosetValue(outfits, purchasedItems),
    [outfits, purchasedItems],
  );

  const averageMatch = useMemo(
    () => deriveAverageOutfitMatch(outfits),
    [outfits],
  );

  const lastUpdated = useMemo(
    () => deriveLastUpdated(outfits, purchasedItems),
    [outfits, purchasedItems],
  );

  const insights = useMemo(
    () => deriveClosetInsights({ outfits, brands, colors, purchasedItems }),
    [outfits, brands, colors, purchasedItems],
  );

  const purchasedGridClassName = 'grid grid-cols-2 gap-4 sm:grid-cols-4';
  const outfitsGridClassName = 'grid grid-cols-2 gap-4 lg:grid-cols-4';

  if (overviewLoading && purchasedLoading) {
    return <ClosetSkeleton />;
  }

  if (overviewError || purchasedError || outfitsError) {
    return (
      <ErrorState
        title="Could not load your closet"
        description="We had trouble fetching your wardrobe data."
        onRetry={() => {
          refetchOverview();
          refetchPurchased();
          refetchOutfits();
          refetchBrands();
          refetchColors();
        }}
      />
    );
  }

  return (
    <div className="-mx-4 space-y-10 px-4 pb-10 animate-in fade-in duration-500 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
      <ClosetOverviewCards
        overview={overview}
        isLoading={overviewLoading}
        userName={userName}
        closetValue={closetValue}
        averageMatch={averageMatch}
        lastUpdated={lastUpdated}
        totalOutfits={outfits.length}
      />

      <ClosetQuickActions onExport={handleExportCloset} />

      <ClosetSearchBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        category={category}
        onCategoryChange={(value) => {
          setCategory(value);
          setPage(1);
        }}
        brand={brand}
        onBrandChange={setBrand}
        color={color}
        onColorChange={setColor}
        minPrice={minPrice}
        onMinPriceChange={setMinPrice}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        recentlyAdded={recentlyAdded}
        onRecentlyAddedChange={setRecentlyAdded}
        occasion={occasion}
        onOccasionChange={setOccasion}
        season={season}
        onSeasonChange={setSeason}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onClear={clearFilters}
      />

      <ClosetInsightsPanel insights={insights} />

      <ClosetTabNav activeTab={activeTab} />

      {activeTab === CLOSET_TABS.WARDROBE ? (
        <div className="space-y-10">
          <section className="space-y-5">
            <ClosetSectionHeader
              title="Saved Outfits"
              description="Looks saved from Digital Avatar, Virtual Try-On, and Recommendations."
              viewAllHref={getClosetSectionHref('outfits')}
              totalCount={filteredOutfits.length}
            />

            {outfitsLoading ? (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Loader2 className="size-4 animate-spin" />
                Loading outfits...
              </div>
            ) : !filteredOutfits.length ? (
              <PremiumEmptyState
                icon={Sparkles}
                title="Save outfits from Digital Avatar or Virtual Try-On."
                description="Build a look, save it, and it will show up here with price and item count."
                actionLabel="Open Virtual Try-On"
                onAction={() => router.push(ROUTES.AI.VIRTUAL_TRY_ON)}
              />
            ) : (
              <div className={outfitsGridClassName}>
                {visibleOutfits.map((outfit) => (
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
            )}
          </section>

          <section className="space-y-5">
            <ClosetSectionHeader
              title="Purchased Items"
              description="Products from delivered orders in your wardrobe."
              viewAllHref={getClosetSectionHref('purchases')}
              totalCount={meta.total || purchasedItems.length}
            />

            {purchasedLoading ? (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Loader2 className="size-4 animate-spin" />
                Loading purchases...
              </div>
            ) : !purchasedItems.length ? (
              <PremiumEmptyState
                icon={Shirt}
                title="Your wardrobe is waiting for its first purchase."
                description="Once an order is delivered, your items will appear here automatically."
                actionLabel="Shop products"
                onAction={() => router.push(ROUTES.PRODUCTS.LIST)}
              />
            ) : (
              <div className={purchasedGridClassName}>
                {visiblePurchasedItems.map((item) => (
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
            )}
          </section>

          <ClosetRecentActivity
            activities={previewRecentActivity}
            limit={CLOSET_PREVIEW_LIMIT}
            viewAllHref={getClosetSectionHref('activity')}
            totalCount={allRecentActivity.length}
          />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="space-y-5">
            <ClosetSectionHeader
              title="Favorite Brands"
              description="Calculated from purchases, wishlist, and saved outfits."
              viewAllHref={getClosetSectionHref('brands')}
              totalCount={filteredBrands.length}
            />
            {brandsLoading ? (
              <Skeleton className="h-24 rounded-[22px] bg-white/5" />
            ) : !filteredBrands.length ? (
              <p className="rounded-[22px] border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center text-sm text-white/45">
                No brand preferences yet.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {previewBrands.map((item) => (
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
            )}
          </section>

          <section className="space-y-5">
            <ClosetSectionHeader
              title="Favorite Colors"
              description="Your most-used colors across wardrobe activity."
              viewAllHref={getClosetSectionHref('colors')}
              totalCount={filteredColors.length}
            />
            {colorsLoading ? (
              <Skeleton className="h-24 rounded-[22px] bg-white/5" />
            ) : !filteredColors.length ? (
              <p className="rounded-[22px] border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center text-sm text-white/45">
                No color trends detected yet.
              </p>
            ) : (
              <div className="grid gap-3">
                {previewColors.map((item) => (
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
            )}
          </section>
        </div>
      )}

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
    </div>
  );
}
