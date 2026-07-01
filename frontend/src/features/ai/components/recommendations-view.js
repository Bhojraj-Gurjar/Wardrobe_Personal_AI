'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useRecommendationsSections } from '@/features/ai/hooks/use-recommendations-sections';
import { useFashionDnaQuery } from '@/features/fashion-dna/hooks';
import { useFaceAnalysisQuery } from '@/features/face-analysis/hooks';
import { useBodyAnalysisQuery } from '@/features/body-analysis/hooks';
import { RecommendationCarouselSection } from '@/features/ai/components/recommendation-carousel-section';
import { CompleteOutfitSuggestionsSection } from '@/features/ai/components/complete-outfit-suggestions-section';
import {
  RECOMMENDATION_CATEGORY_FILTERS,
  RECOMMENDATION_SECTION_FILTERS,
  RECOMMENDATION_SECTION_META,
  RECOMMENDATION_SORT_OPTIONS,
} from '@/features/ai/constants/recommendations.constants';
import {
  buildOutfitSuggestions,
  getCurrentSeasonLabel,
} from '@/features/ai/utils/recommendations.util';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

function RecommendationsSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Skeleton className="h-6 w-28 rounded-full bg-dashboard-surface" />
        <Skeleton className="h-10 w-80 max-w-full rounded-xl bg-dashboard-surface" />
        <Skeleton className="h-4 w-64 rounded-lg bg-dashboard-surface" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-full bg-dashboard-surface" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-4">
          <Skeleton className="h-7 w-56 rounded-lg bg-dashboard-surface" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((__, cardIndex) => (
              <Skeleton
                key={cardIndex}
                className="h-[420px] min-w-[280px] shrink-0 rounded-2xl bg-dashboard-surface"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecommendationsView() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortId, setSortId] = useState('match');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    daily,
    seasonal,
    trending,
    default: defaultRecommendations,
    isLoading,
    isError,
    error,
    refetch,
    factors,
    emptyState,
  } = useRecommendationsSections({ limit: 12 });

  const { data: fashionDna } = useFashionDnaQuery();
  const { data: faceAnalysis } = useFaceAnalysisQuery();
  const { data: bodyAnalysis } = useBodyAnalysisQuery();

  const outfitSuggestions = useMemo(
    () => buildOutfitSuggestions({
      items: defaultRecommendations?.items || daily?.items || [],
      fashionDna,
      faceAnalysis,
      bodyAnalysis,
      maxOutfits: 3,
    }),
    [bodyAnalysis, daily?.items, defaultRecommendations?.items, faceAnalysis, fashionDna],
  );

  const personalizationSummary = useMemo(() => {
    const chips = [];

    const styleType = fashionDna?.styleType || fashionDna?.style_type;
    if (styleType) {
      chips.push(`Because you like ${String(styleType).replace(/_/g, ' ')}`);
    }

    if (factors?.body_type) {
      chips.push(`Matches your ${String(factors.body_type).replace(/_/g, ' ')} body type`);
    }

    if (Array.isArray(factors?.favorite_colors) && factors.favorite_colors.length) {
      chips.push('Matches your color palette');
    }

    chips.push(`Recommended for ${getCurrentSeasonLabel()}`);

    return chips.slice(0, 4);
  }, [factors, fashionDna]);

  const showDaily = activeSection === 'all' || activeSection === 'daily';
  const showSeasonal = activeSection === 'all' || activeSection === 'seasonal';
  const showTrending = activeSection === 'all' || activeSection === 'trending';
  const showOutfits = activeSection === 'all' || activeSection === 'outfits';

  if (isLoading) {
    return <RecommendationsSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load recommendations"
        description={error?.message}
        onRetry={refetch}
      />
    );
  }

  if (emptyState?.requires_profile) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Personalized recommendations unavailable"
        description={
          emptyState.message
          || 'Complete your profile to receive personalized recommendations.'
        }
        actionLabel="Complete profile"
        onAction={() => {
          router.push(ROUTES.PROFILE.HOME);
        }}
      />
    );
  }

  return (
    <div className="min-w-0 space-y-6 md:space-y-10">
      <header className="space-y-2 md:space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8B5CF6]/35 bg-[#8B5CF6]/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C4B5FD] md:gap-2 md:px-3 md:py-1 md:text-[11px] md:tracking-[0.18em]">
          <Sparkles className="size-3 text-[#A78BFA] md:size-3.5" aria-hidden="true" />
          AI Personal Stylist
        </span>
        <div className="space-y-1 md:space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-dashboard-foreground sm:text-3xl md:text-4xl">
            Your Recommendations
          </h1>
          <p className="text-xs leading-snug text-dashboard-muted md:text-sm md:leading-normal lg:text-base">
            Daily picks, seasonal styles, trending items, and complete outfits — tailored to you
          </p>
        </div>

        {personalizationSummary.length ? (
          <div className="flex snap-x gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x whitespace-nowrap md:flex-wrap md:overflow-visible md:pb-0 md:whitespace-normal [&::-webkit-scrollbar]:hidden">
            {personalizationSummary.map((chip) => (
              <span
                key={chip}
                className="shrink-0 snap-start rounded-full border border-[#8B5CF6]/25 bg-[#8B5CF6]/10 px-2.5 py-1 text-xs font-medium text-[#DDD6FE] md:px-3"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <div className="space-y-2.5 md:space-y-4">
        <div className="flex flex-col gap-2.5 md:gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex snap-x gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x md:flex-wrap md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
            {RECOMMENDATION_SECTION_FILTERS.map((filter) => {
              const active = activeSection === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveSection(filter.id)}
                  className={cn(
                    'shrink-0 snap-start whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors md:px-4 md:py-2 md:text-sm',
                    active
                      ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/25'
                      : 'border border-white/10 bg-[#121820] text-dashboard-muted hover:border-white/20 hover:text-dashboard-foreground',
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setFiltersOpen((current) => !current)}
            className="h-9 w-full shrink-0 rounded-full border-white/10 bg-[#121820] px-4 text-xs text-dashboard-foreground hover:bg-[#1A2235] md:h-10 md:w-auto md:text-sm"
          >
            <SlidersHorizontal className="mr-2 size-3.5 md:size-4" />
            Filters & Sort
          </Button>
        </div>

        <div className="flex snap-x gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x md:flex-wrap md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
          {RECOMMENDATION_CATEGORY_FILTERS.map((filter) => {
            const active = activeCategory === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveCategory(filter.id)}
                className={cn(
                  'shrink-0 snap-start whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors md:px-3 md:py-1.5',
                  active
                    ? 'bg-white/10 text-dashboard-foreground'
                    : 'text-dashboard-muted hover:text-dashboard-foreground',
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {filtersOpen ? (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/8 bg-[#121820] p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
              Sort by
            </span>
            {RECOMMENDATION_SORT_OPTIONS.map((option) => {
              const active = sortId === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSortId(option.id)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm transition-colors',
                    active
                      ? 'bg-[#8B5CF6]/20 text-[#DDD6FE]'
                      : 'text-dashboard-muted hover:text-dashboard-foreground',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="ml-auto inline-flex items-center gap-1 text-xs text-dashboard-muted hover:text-dashboard-foreground"
            >
              <X className="size-3.5" />
              Close
            </button>
          </div>
        ) : null}
      </div>

      {showDaily ? (
        <RecommendationCarouselSection
          title={RECOMMENDATION_SECTION_META.daily.title}
          subtitle={RECOMMENDATION_SECTION_META.daily.subtitle}
          featureBadge={RECOMMENDATION_SECTION_META.daily.featureBadge}
          items={daily?.items || []}
          mode="daily"
          factors={factors}
          fashionDna={fashionDna}
          categoryFilter={activeCategory}
          sortId={sortId}
        />
      ) : null}

      {showSeasonal ? (
        <RecommendationCarouselSection
          title={RECOMMENDATION_SECTION_META.seasonal.title}
          subtitle={`${RECOMMENDATION_SECTION_META.seasonal.subtitle} — ${getCurrentSeasonLabel()} collection`}
          featureBadge={{
            label: `${getCurrentSeasonLabel()} Pick`,
            tone: 'teal',
          }}
          items={seasonal?.items || []}
          mode="seasonal"
          factors={factors}
          fashionDna={fashionDna}
          categoryFilter={activeCategory}
          sortId={sortId}
        />
      ) : null}

      {showTrending ? (
        <RecommendationCarouselSection
          title={RECOMMENDATION_SECTION_META.trending.title}
          subtitle={RECOMMENDATION_SECTION_META.trending.subtitle}
          featureBadge={RECOMMENDATION_SECTION_META.trending.featureBadge}
          items={trending?.items || []}
          mode="trending"
          factors={factors}
          fashionDna={fashionDna}
          categoryFilter={activeCategory}
          sortId={sortId}
        />
      ) : null}

      {showOutfits ? (
        <CompleteOutfitSuggestionsSection
          outfits={outfitSuggestions}
          isLoading={false}
        />
      ) : null}

      {!showDaily && !showSeasonal && !showTrending && !showOutfits ? (
        <EmptyState
          icon={Sparkles}
          title="No recommendations in this view"
          description="Try another section filter or browse the full catalog."
          actionLabel="Browse products"
          onAction={() => router.push(ROUTES.PRODUCTS.LIST)}
        />
      ) : null}
    </div>
  );
}
