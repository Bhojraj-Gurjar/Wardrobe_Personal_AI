'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { GlobalSearchDropdown } from '@/features/search/components/global-search-dropdown';
import {
  rememberSearchQuery,
  useClearSearchHistory,
  useMergedRecentSearches,
  useSearchHistoryQuery,
  useSearchSuggestions,
} from '@/features/search/hooks/use-global-search';
import { buildSearchResultsUrl } from '@/features/search/utils/search.utils';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

const searchInputClass = cn(
  'h-10 py-0 pl-9 text-xs placeholder:text-xs',
  'md:h-12 md:pl-10 md:text-sm md:placeholder:text-sm',
);

const searchIconClass = 'pointer-events-none absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-dashboard-muted md:left-3 md:size-4';

function SearchInputFallback({ className }) {
  return (
    <div className={cn('relative w-full min-w-0 flex-1 lg:mx-auto lg:max-w-xl', className)}>
      <Search className={searchIconClass} aria-hidden="true" />
      <Input
        disabled
        placeholder="Search styles, brands, outfits..."
        className={searchInputClass}
      />
    </div>
  );
}

function DashboardSearchBarInner({ className }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const shouldSyncFromUrl = pathname.startsWith(ROUTES.PRODUCTS.LIST)
    || pathname.startsWith(ROUTES.PRODUCTS.SEARCH);

  useEffect(() => {
    if (!shouldSyncFromUrl) {
      return;
    }

    setSearch(searchParams.get('q') || searchParams.get('search') || '');
  }, [pathname, searchParams, shouldSyncFromUrl]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const {
    data: suggestions,
    debouncedQuery,
    isLoading,
    isError,
    error,
  } = useSearchSuggestions(search, { enabled: open });

  const { data: historyData, refetch: refetchHistory } = useSearchHistoryQuery(open);
  const clearHistory = useClearSearchHistory();

  const { recent, trending } = useMergedRecentSearches(
    historyData,
    suggestions?.trendingSearches,
  );

  const navigateToSearch = useCallback((query) => {
    const normalized = String(query || '').trim();
    setOpen(false);

    if (!normalized) {
      router.push(ROUTES.PRODUCTS.LIST);
      return;
    }

    rememberSearchQuery(normalized);
    refetchHistory();
    router.push(buildSearchResultsUrl(normalized));
  }, [router, refetchHistory]);

  const handleSubmit = (event) => {
    event.preventDefault();
    navigateToSearch(search);
  };

  const handleSelect = (value) => {
    if (typeof value === 'string') {
      setSearch(value);
      navigateToSearch(value);
    }
  };

  const handleClearHistory = async () => {
    await clearHistory();
    refetchHistory();
  };

  const dropdownSuggestions = debouncedQuery.trim()
    ? suggestions
    : {
        products: suggestions?.products || [],
        brands: suggestions?.brands || [],
      };

  return (
    <div ref={containerRef} className={cn('relative flex-1 lg:mx-auto lg:max-w-xl', className)}>
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Search products"
      >
        <Search
          className={searchIconClass}
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search styles, brands, outfits..."
          aria-label="Search styles, brands, outfits"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          className={searchInputClass}
        />
      </form>

      {open ? (
        <GlobalSearchDropdown
          open={open}
          query={search}
          suggestions={dropdownSuggestions}
          recentSearches={recent}
          trendingSearches={trending}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error?.message}
          onSelect={handleSelect}
          onClearHistory={handleClearHistory}
        />
      ) : null}
    </div>
  );
}

export function DashboardSearchBar(props) {
  return (
    <Suspense fallback={<SearchInputFallback className={props.className} />}>
      <DashboardSearchBarInner {...props} />
    </Suspense>
  );
}
