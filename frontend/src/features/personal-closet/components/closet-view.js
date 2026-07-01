'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Loader2,
  Shirt,
  Sparkles,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import { useAddToWishlistMutation } from '@/features/wishlist/hooks';
import { useProfileQuery } from '@/features/profile/hooks/use-profile';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClosetOverviewCards } from '@/features/personal-closet/components/closet-overview-cards';
import { ClosetSearchBar } from '@/features/personal-closet/components/closet-search-bar';
import { ClosetQuickActions } from '@/features/personal-closet/components/closet-quick-actions';
import { ClosetInsightsPanel } from '@/features/personal-closet/components/closet-insights-panel';
import { ClosetRecentActivity } from '@/features/personal-closet/components/closet-recent-activity';
import { OutfitCard } from '@/features/personal-closet/components/outfit-card';
import {
  getProductDetailRoute,
  PurchasedItemCard,
} from '@/features/personal-closet/components/purchased-item-card';
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
  CLOSET_CARD_HOVER,
  CLOSET_GLASS_CARD,
} from '@/features/personal-closet/styles/closet-design-tokens';
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

const CLOSET_PREVIEW_LIMIT = 4;

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

function SectionHeader({
  title,
  description,
  showViewAll = false,
  isExpanded = false,
  onToggleViewAll,
  totalCount = 0,
  previewLimit = CLOSET_PREVIEW_LIMIT,
}) {
  const canExpand = totalCount > previewLimit;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A855F7]">
          {title}
        </p>
        {description ? (
          <p className="text-sm text-white/50">{description}</p>
        ) : null}
      </div>
      {showViewAll && canExpand ? (
        <button
          type="button"
          onClick={onToggleViewAll}
          className={cn(
            'shrink-0 rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-4 py-1.5 text-sm font-semibold text-[#E9D5FF]',
            'transition hover:bg-[#7C3AED]/20',
          )}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Show Less' : 'View All'}
        </button>
      ) : null}
    </div>
  );
}

function BrandCard({ brand, onBrowse, onRemove, isRemoving }) {
  const initials = brand.brandName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const compatibility = Math.min(98, 62 + (brand.interactionCount || 0) * 3);
  const purchasedEstimate = Math.max(1, Math.round((brand.interactionCount || 1) * 0.45));
  const wishlistEstimate = Math.max(0, (brand.interactionCount || 0) - purchasedEstimate);

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        CLOSET_GLASS_CARD,
        CLOSET_CARD_HOVER,
        'overflow-hidden p-4',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED]/25 to-[#A855F7]/10 text-sm font-bold text-white shadow-[0_0_24px_rgba(124,58,237,0.2)]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-white">{brand.brandName}</h3>
            {(brand.interactionCount || 0) >= 8 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                <Crown className="size-3" aria-hidden="true" />
                Luxury
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-white/45">
            {brand.interactionCount} interactions · {brand.preferredCategory}
          </p>
          <p className="mt-1 text-[11px] text-white/35">
            {purchasedEstimate} purchased · {wishlistEstimate} wishlist
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-white/45">
          <span>AI Compatibility</span>
          <span className="font-semibold text-[#C4B5FD]">{compatibility}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"
            style={{ width: `${compatibility}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          className="flex-1 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white hover:brightness-110"
          onClick={() => onBrowse(brand)}
        >
          Browse
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-xl text-red-300 hover:bg-red-500/10"
          disabled={isRemoving}
          onClick={() => onRemove(brand)}
        >
          Remove
        </Button>
      </div>
    </motion.article>
  );
}

function ColorCard({ color, onRemove, isRemoving, outfitCount = 0 }) {
  const productEstimate = Math.max(1, Math.round((color.usagePercent || 0) / 8));
  const seasonTag = ['black', 'dark', 'navy'].includes(color.colorName?.toLowerCase())
    ? 'Winter'
    : ['olive', 'cornflower'].includes(color.colorName?.toLowerCase())
      ? 'Spring'
      : 'All Season';

  return (
    <motion.article
      whileHover={{ y: -3, scale: 1.01 }}
      className={cn(
        CLOSET_GLASS_CARD,
        'group overflow-hidden p-4 transition hover:border-[#7C3AED]/35 hover:shadow-[0_12px_36px_rgba(124,58,237,0.15)]',
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <span
            className="block size-16 rounded-full border-2 border-white/15 shadow-[0_0_30px_rgba(124,58,237,0.25)] transition group-hover:scale-105"
            style={{ backgroundColor: color.hexCode }}
            aria-hidden="true"
          />
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-mono text-white/70">
            {color.hexCode}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-white">{color.colorName}</h3>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
              {seasonTag}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/45">{color.usagePercent}% of your palette</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"
              style={{ width: `${Math.min(100, color.usagePercent || 0)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-white/35">
            ~{productEstimate} products · {outfitCount} outfits
          </p>
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="rounded-xl text-red-300 hover:bg-red-500/10"
          disabled={isRemoving}
          onClick={() => onRemove(color)}
        >
          Remove
        </Button>
      </div>
    </motion.article>
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
  const authUser = useUserProfile();
  const { data: profile } = useProfileQuery();

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
  const [purchasedExpanded, setPurchasedExpanded] = useState(false);
  const [outfitsExpanded, setOutfitsExpanded] = useState(false);

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
    () => (
      purchasedExpanded
        ? purchasedItems
        : purchasedItems.slice(0, CLOSET_PREVIEW_LIMIT)
    ),
    [purchasedExpanded, purchasedItems],
  );

  const visibleOutfits = useMemo(
    () => (
      outfitsExpanded
        ? filteredOutfits
        : filteredOutfits.slice(0, CLOSET_PREVIEW_LIMIT)
    ),
    [outfitsExpanded, filteredOutfits],
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

  const recentActivity = useMemo(
    () => deriveRecentActivity(outfits, purchasedItems),
    [outfits, purchasedItems],
  );

  const purchasedGridClassName = purchasedExpanded
    ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
    : 'grid grid-cols-2 gap-4 sm:grid-cols-4';

  const outfitsGridClassName = outfitsExpanded
    ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    : 'grid grid-cols-2 gap-4 lg:grid-cols-4';

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

      <section className="space-y-5">
        <SectionHeader
          title="Saved Outfits"
          description="Looks saved from Digital Avatar, Virtual Try-On, and Recommendations."
          showViewAll
          isExpanded={outfitsExpanded}
          onToggleViewAll={() => setOutfitsExpanded((open) => !open)}
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
        <SectionHeader
          title="Purchased Items"
          description="Products from delivered orders in your wardrobe."
          showViewAll
          isExpanded={purchasedExpanded}
          onToggleViewAll={() => setPurchasedExpanded((open) => !open)}
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
          <>
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

            {purchasedExpanded && meta.totalPages > 1 ? (
              <div className="flex items-center justify-center gap-3">
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
        )}
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <SectionHeader
            title="Favorite Brands"
            description="Calculated from purchases, wishlist, and saved outfits."
          />
          {brandsLoading ? (
            <Skeleton className="h-24 rounded-[22px] bg-white/5" />
          ) : !filteredBrands.length ? (
            <p className="rounded-[22px] border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center text-sm text-white/45">
              No brand preferences yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredBrands.map((item) => (
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
        </div>

        <div className="space-y-5">
          <SectionHeader
            title="Favorite Colors"
            description="Your most-used colors across wardrobe activity."
          />
          {colorsLoading ? (
            <Skeleton className="h-24 rounded-[22px] bg-white/5" />
          ) : !filteredColors.length ? (
            <p className="rounded-[22px] border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center text-sm text-white/45">
              No color trends detected yet.
            </p>
          ) : (
            <div className="grid gap-3">
              {filteredColors.map((item) => (
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
        </div>
      </section>

      <ClosetRecentActivity activities={recentActivity} />

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
