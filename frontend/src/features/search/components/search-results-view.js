'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Sparkles } from 'lucide-react';
import { ProductSidebarFilters } from '@/features/products/components/product-sidebar-filters';
import { ProductCatalogToolbar } from '@/features/products/components/product-catalog-toolbar';
import { ProductGrid } from '@/features/products/components/product-grid';
import { useRecommendationsQuery } from '@/features/ai/hooks';
import {
  getApiCategoryForUi,
  matchesUiCategory,
  PRICE_RANGE,
} from '@/features/products/constants/catalog-categories';
import {
  buildRecommendationScoreMap,
  productMatchesSearch,
  resolveRecommendationItems,
  sortProducts,
  asArray,
} from '@/features/products/utils/product-catalog.utils';
import { useSearchResultsQuery } from '@/features/search/hooks/use-search-results';
import { rememberSearchQuery } from '@/features/search/hooks/use-global-search';
import { buildBrandUrl, buildCategoryUrl, buildSearchResultsUrl } from '@/features/search/utils/search.utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

function mapSortToApi(sortId) {
  if (sortId === 'price_asc') {
    return { sortBy: 'price', sortOrder: 'asc' };
  }

  if (sortId === 'price_desc') {
    return { sortBy: 'price', sortOrder: 'desc' };
  }

  return { sortBy: 'created_at', sortOrder: 'desc' };
}

export function SearchResultsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || searchParams.get('search') || '';

  const [uiCategory, setUiCategory] = useState('all');
  const [productType, setProductType] = useState('');
  const [sortId, setSortId] = useState('best_match');
  const [viewMode, setViewMode] = useState('grid');
  const [priceRange, setPriceRange] = useState([PRICE_RANGE.min, PRICE_RANGE.max]);
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());

  useEffect(() => {
    if (deferredQuery) {
      rememberSearchQuery(deferredQuery);
    }
  }, [deferredQuery]);

  useEffect(() => {
    setPage(1);
  }, [deferredQuery, uiCategory, productType, priceRange, sortId]);

  const apiSort = mapSortToApi(sortId);
  const apiCategory = getApiCategoryForUi(uiCategory);

  const { data, isLoading, isError, error, refetch, isFetching } = useSearchResultsQuery({
    q: deferredQuery,
    page: 1,
    limit: 100,
    productType: productType || undefined,
    min_price: priceRange[0] > PRICE_RANGE.min ? priceRange[0] : undefined,
    max_price: priceRange[1] < PRICE_RANGE.max ? priceRange[1] : undefined,
    category: apiCategory,
    ...apiSort,
  });

  const { data: recommendations } = useRecommendationsQuery({ limit: 50 });
  const scoreByProductId = useMemo(
    () => buildRecommendationScoreMap(resolveRecommendationItems(recommendations)),
    [recommendations],
  );

  const processedProducts = useMemo(() => {
    const source = asArray(data?.items);
    const filtered = source.filter(
      (product) =>
        matchesUiCategory(product, uiCategory)
        && productMatchesSearch(product, deferredQuery),
    );
    return sortProducts(filtered, sortId, scoreByProductId);
  }, [data?.items, uiCategory, deferredQuery, sortId, scoreByProductId]);

  const pageSize = 12;
  const totalItems = processedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = processedProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const bestMatchProductId = useMemo(() => {
    if (!processedProducts.length) {
      return null;
    }

    return processedProducts.reduce((bestId, product) => {
      const currentScore = scoreByProductId[product.id] ?? 0;
      const bestScore = bestId ? scoreByProductId[bestId] ?? 0 : -1;
      return currentScore > bestScore ? product.id : bestId;
    }, null);
  }, [processedProducts, scoreByProductId]);

  const suggestionBrands = useMemo(() => {
    const brands = new Set();
    processedProducts.forEach((product) => {
      if (product?.brand) {
        brands.add(product.brand);
      }
    });
    return [...brands].slice(0, 4);
  }, [processedProducts]);

  const closeFilters = () => setIsFilterOpen(false);
  const toggleFilters = () => setIsFilterOpen((open) => !open);

  const filterPanelProps = {
    uiCategory,
    productType,
    priceRange,
    onCategoryChange: (category) => {
      setUiCategory(category);
      setPage(1);
    },
    onProductTypeChange: (type) => {
      setProductType(type || '');
      setPage(1);
    },
    onPriceRangeChange: (range) => {
      setPriceRange(range);
      setPage(1);
    },
    onClose: closeFilters,
  };

  if (!deferredQuery) {
    return (
      <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface px-6 py-16 text-center">
        <Search className="mx-auto size-10 text-dashboard-muted" />
        <h2 className="mt-4 text-lg font-semibold text-dashboard-foreground">Search Wardrobe AI</h2>
        <p className="mt-2 text-sm text-dashboard-muted">
          Use the search bar above to find products, brands, categories, and styles.
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface px-4 py-4 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-dashboard-muted">Search results</p>
        <h1 className="mt-1 text-xl font-bold text-dashboard-foreground">
          Results for &quot;{deferredQuery}&quot;
        </h1>
        <p className="mt-1 text-sm text-dashboard-muted">
          {isLoading || isFetching ? 'Searching...' : `${totalItems} result${totalItems === 1 ? '' : 's'} found`}
        </p>
      </div>

      {isFilterOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden"
          onClick={closeFilters}
          aria-label="Close filters"
        />
      ) : null}

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[min(300px,88vw)] p-4 pt-24 transition-transform duration-300 ease-out lg:hidden',
          isFilterOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none',
        )}
      >
        <ProductSidebarFilters
          id="search-filters-panel"
          {...filterPanelProps}
          className="max-h-[calc(100vh-7rem)] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        />
      </div>

      <div
        className={cn(
          'grid gap-6 transition-[grid-template-columns] duration-300 ease-out',
          isFilterOpen ? 'lg:grid-cols-[280px_minmax(0,1fr)]' : 'grid-cols-1',
        )}
      >
        {isFilterOpen ? (
          <ProductSidebarFilters
            id="search-filters-panel-desktop"
            {...filterPanelProps}
            className="hidden lg:block"
          />
        ) : null}

        <div className="min-w-0 space-y-6">
          <ProductCatalogToolbar
            search={deferredQuery}
            uiCategory={uiCategory}
            sortId={sortId}
            viewMode={viewMode}
            resultCount={totalItems}
            isFilterOpen={isFilterOpen}
            onSearchChange={() => {}}
            searchReadOnly
            onCategoryChange={(category) => {
              setUiCategory(category);
              setPage(1);
            }}
            onSortChange={(nextSort) => {
              setSortId(nextSort);
              setPage(1);
            }}
            onViewModeChange={setViewMode}
            onFilterToggle={toggleFilters}
          />

          {!isLoading && !isError && !processedProducts.length ? (
            <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface px-6 py-12 text-center">
              <Sparkles className="mx-auto size-10 text-primary" />
              <h2 className="mt-4 text-lg font-semibold text-dashboard-foreground">No results found</h2>
              <p className="mt-2 text-sm text-dashboard-muted">
                We couldn&apos;t find anything for &quot;{deferredQuery}&quot;. Try a different keyword or browse by brand.
              </p>
              {suggestionBrands.length ? (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {suggestionBrands.map((brand) => (
                    <Button
                      key={brand}
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(buildBrandUrl(brand))}
                    >
                      {brand}
                    </Button>
                  ))}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button type="button" size="sm" onClick={() => router.push(buildCategoryUrl('tops'))}>
                  Browse tops
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(buildSearchResultsUrl('jacket'))}
                >
                  Try &quot;jacket&quot;
                </Button>
              </div>
            </div>
          ) : (
            <ProductGrid
              items={pagedProducts}
              total={totalItems}
              page={currentPage}
              limit={pageSize}
              viewMode={viewMode}
              scoreByProductId={scoreByProductId}
              bestMatchProductId={bestMatchProductId}
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRetry={refetch}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
