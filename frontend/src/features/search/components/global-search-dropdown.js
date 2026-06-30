'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Clock3,
  Flame,
  Loader2,
  Search,
  Star,
  Tag,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import {
  formatProductPrice,
  getProductImageUrl,
} from '@/features/products/utils/product-catalog.utils';
import {
  buildBrandUrl,
  buildCategoryUrl,
  buildCollectionUrl,
  buildSearchResultsUrl,
  buildStyleUrl,
} from '../utils/search.utils';
import { SearchHighlight } from './search-highlight';

function SectionTitle({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between px-3 pt-3 pb-1">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-dashboard-muted">
        <Icon className="size-3.5" />
        {title}
      </div>
      {action}
    </div>
  );
}

function SuggestionLink({ href, onClick, children, className }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-dashboard-surface-elevated',
        className,
      )}
    >
      {children}
    </Link>
  );
}

function ProductSuggestion({ product, query, onSelect }) {
  const imageUrl = getProductImageUrl(product);
  const rating = product?.rating ?? product?.rating_avg;

  return (
    <SuggestionLink
      href={ROUTES.PRODUCTS.DETAIL(product.id)}
      onClick={onSelect}
      className="flex items-center gap-3 py-2.5"
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-dashboard-surface-elevated">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-dashboard-foreground">
          <SearchHighlight text={product.name} query={query} />
        </p>
        <p className="truncate text-xs text-dashboard-muted">
          {[product.brand, product.category].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span className="font-semibold text-primary">
            {formatProductPrice(product.price, product.currency)}
          </span>
          {rating ? (
            <span className="inline-flex items-center gap-1 text-dashboard-muted">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {Number(rating).toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </SuggestionLink>
  );
}

export function GlobalSearchDropdown({
  open,
  query,
  suggestions,
  recentSearches = [],
  trendingSearches = [],
  isLoading = false,
  isError = false,
  errorMessage = null,
  onSelect,
  onClearHistory,
  className,
}) {
  const trimmedQuery = query.trim();
  const hasQuery = Boolean(trimmedQuery);
  const products = suggestions?.products || [];
  const brands = suggestions?.brands || [];
  const categories = suggestions?.categories || [];
  const collections = suggestions?.collections || [];
  const styles = suggestions?.styles || [];
  const showEmptyState = !hasQuery;
  const showNoResults = hasQuery
    && !isLoading
    && !isError
    && !products.length
    && !brands.length
    && !categories.length
    && !collections.length
    && !styles.length;

  return (
    <div
      className={cn(
        'absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl border border-dashboard-border',
        'bg-[#0B1020] shadow-2xl',
        className,
      )}
    >
      {isLoading ? (
        <div className="flex items-center gap-2 px-4 py-6 text-sm text-dashboard-muted">
          <Loader2 className="size-4 animate-spin" />
          Searching...
        </div>
      ) : null}

      {isError ? (
        <div className="px-4 py-6 text-sm text-dashboard-muted">
          {errorMessage || 'Search is temporarily unavailable. Please try again.'}
        </div>
      ) : null}

      {!isLoading && !isError && showEmptyState ? (
        <>
          {recentSearches.length ? (
            <section>
              <SectionTitle
                icon={Clock3}
                title="Recent searches"
                action={(
                  <button
                    type="button"
                    onClick={onClearHistory}
                    className="inline-flex items-center gap-1 text-[11px] text-dashboard-muted transition hover:text-dashboard-foreground"
                  >
                    <Trash2 className="size-3" />
                    Clear
                  </button>
                )}
              />
              {recentSearches.map((term) => (
                <SuggestionLink
                  key={term}
                  href={buildSearchResultsUrl(term)}
                  onClick={() => onSelect(term)}
                >
                  <SearchHighlight text={term} query="" />
                </SuggestionLink>
              ))}
            </section>
          ) : null}

          {products.length ? (
            <section>
              <SectionTitle icon={Flame} title="Trending products" />
              {products.map((product) => (
                <ProductSuggestion
                  key={product.id}
                  product={product}
                  query=""
                  onSelect={() => onSelect(product.name)}
                />
              ))}
            </section>
          ) : null}

          {brands.length ? (
            <section className="pb-2">
              <SectionTitle icon={TrendingUp} title="Popular brands" />
              <div className="flex flex-wrap gap-2 px-3 pb-3">
                {brands.map((brand) => (
                  <Link
                    key={brand}
                    href={buildBrandUrl(brand)}
                    onClick={() => onSelect(brand)}
                    className="rounded-full border border-dashboard-border bg-dashboard-surface px-3 py-1.5 text-xs text-dashboard-foreground transition hover:border-primary/40 hover:bg-primary/10"
                  >
                    {brand}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {!isLoading && !isError && hasQuery ? (
        <>
          {products.length ? (
            <section>
              <SectionTitle icon={Search} title="Products" />
              {products.map((product) => (
                <ProductSuggestion
                  key={product.id}
                  product={product}
                  query={trimmedQuery}
                  onSelect={() => onSelect(trimmedQuery)}
                />
              ))}
            </section>
          ) : null}

          {brands.length ? (
            <section>
              <SectionTitle icon={Tag} title="Brands" />
              {brands.map((brand) => (
                <SuggestionLink
                  key={brand}
                  href={buildBrandUrl(brand)}
                  onClick={() => onSelect(brand)}
                >
                  <SearchHighlight text={brand} query={trimmedQuery} />
                </SuggestionLink>
              ))}
            </section>
          ) : null}

          {categories.length ? (
            <section>
              <SectionTitle icon={Tag} title="Categories" />
              {categories.map((category) => (
                <SuggestionLink
                  key={category}
                  href={buildCategoryUrl(category)}
                  onClick={() => onSelect(category)}
                >
                  <SearchHighlight text={category} query={trimmedQuery} />
                </SuggestionLink>
              ))}
            </section>
          ) : null}

          {collections.length ? (
            <section>
              <SectionTitle icon={Tag} title="Collections" />
              {collections.map((collection) => (
                <SuggestionLink
                  key={collection}
                  href={buildCollectionUrl(collection)}
                  onClick={() => onSelect(collection)}
                >
                  <SearchHighlight text={collection} query={trimmedQuery} />
                </SuggestionLink>
              ))}
            </section>
          ) : null}

          {styles.length ? (
            <section>
              <SectionTitle icon={Tag} title="Styles" />
              {styles.map((style) => (
                <SuggestionLink
                  key={style}
                  href={buildStyleUrl(style)}
                  onClick={() => onSelect(style)}
                >
                  <SearchHighlight text={style} query={trimmedQuery} />
                </SuggestionLink>
              ))}
            </section>
          ) : null}

          {trendingSearches.length ? (
            <section className="border-t border-dashboard-border/70">
              <SectionTitle icon={TrendingUp} title="Trending searches" />
              {trendingSearches.map((term) => (
                <SuggestionLink
                  key={term}
                  href={buildSearchResultsUrl(term)}
                  onClick={() => onSelect(term)}
                >
                  <SearchHighlight text={term} query={trimmedQuery} />
                </SuggestionLink>
              ))}
            </section>
          ) : null}

          {showNoResults ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-dashboard-foreground">No matches found</p>
              <p className="mt-1 text-xs text-dashboard-muted">
                Try another keyword or press Enter to view all results.
              </p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-3"
                onClick={() => onSelect(trimmedQuery)}
              >
                Search for &quot;{trimmedQuery}&quot;
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
