'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductSidebarFilters } from '@/features/products/components/product-sidebar-filters';
import { ProductCatalogToolbar } from '@/features/products/components/product-catalog-toolbar';
import { ProductGrid } from '@/features/products/components/product-grid';
import { useProductsQuery } from '@/features/products/hooks';
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

export function ProductsView() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || searchParams.get('q') || '';
  const urlBrand = searchParams.get('brand') || '';

  const [uiCategory, setUiCategory] = useState('all');
  const [productType, setProductType] = useState('');
  const [search, setSearch] = useState(urlSearch);
  const [brand, setBrand] = useState(urlBrand);
  const [sortId, setSortId] = useState('best_match');
  const [viewMode, setViewMode] = useState('grid');
  const [priceRange, setPriceRange] = useState([PRICE_RANGE.min, PRICE_RANGE.max]);
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const deferredSearch = useDeferredValue(search.trim());

  useEffect(() => {
    setSearch(urlSearch);
    setBrand(urlBrand);
  }, [urlSearch, urlBrand]);

  const apiSort = mapSortToApi(sortId);
  const apiCategory = getApiCategoryForUi(uiCategory);

  const { data, isLoading, isError, error, refetch } = useProductsQuery({
    page: 1,
    limit: 100,
    search: deferredSearch || undefined,
    brand: brand || undefined,
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
        && productMatchesSearch(product, deferredSearch),
    );
    const sorted = sortProducts(filtered, sortId, scoreByProductId);
    return sorted;
  }, [data?.items, uiCategory, deferredSearch, sortId, scoreByProductId]);

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

  return (
    <div className="relative">
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
          id="product-filters-panel"
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
            id="product-filters-panel-desktop"
            {...filterPanelProps}
            className="hidden lg:block"
          />
        ) : null}

        <div className="min-w-0 space-y-6">
          <ProductCatalogToolbar
            showSearch={false}
            showCategoryChips={false}
            uiCategory={uiCategory}
            sortId={sortId}
            viewMode={viewMode}
            resultCount={totalItems}
            isFilterOpen={isFilterOpen}
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
        </div>
      </div>
    </div>
  );
}
