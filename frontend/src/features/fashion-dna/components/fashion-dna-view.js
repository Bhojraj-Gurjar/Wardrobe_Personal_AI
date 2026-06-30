'use client';

import {
  Grid3x3,
  Heart,
  Palette,
  ScanFace,
  Shirt,
  ShoppingBag,
  Sparkles,
  Tag,
  TrendingUp,
  User,
} from 'lucide-react';
import { useFashionDnaQuery } from '@/features/fashion-dna/hooks';
import { FashionConfidenceCard } from '@/features/fashion-dna/components/FashionConfidenceCard';
import { StyleRadarChart } from '@/features/fashion-dna/components/StyleRadarChart';
import { ScoreHistoryChart } from '@/features/fashion-dna/components/ScoreHistoryChart';
import { StyleAttributesCard } from '@/features/fashion-dna/components/StyleAttributesCard';
import { ColorAffinityCard } from '@/features/fashion-dna/components/ColorAffinityCard';
import { BudgetRangeCard } from '@/features/fashion-dna/components/BudgetRangeCard';
import { BrandAffinityCard } from '@/features/fashion-dna/components/BrandAffinityCard';
import { DnaInsightCard } from '@/features/fashion-dna/components/DnaInsightCard';
import { AiFashionInsightsCard } from '@/features/fashion-dna/components/AiFashionInsightsCard';
import { StyleEvolutionCard } from '@/features/fashion-dna/components/StyleEvolutionCard';
import { WardrobeBalanceCard } from '@/features/fashion-dna/components/WardrobeBalanceCard';
import { ConfidenceBreakdownCard } from '@/features/fashion-dna/components/ConfidenceBreakdownCard';
import { ShoppingInfluenceCard } from '@/features/fashion-dna/components/ShoppingInfluenceCard';
import { SearchBehaviourCard } from '@/features/fashion-dna/components/SearchBehaviourCard';
import { CurrentStyleMoodCard } from '@/features/fashion-dna/components/CurrentStyleMoodCard';
import { FashionJourneyCard } from '@/features/fashion-dna/components/FashionJourneyCard';
import { RecentlyInfluencedCard } from '@/features/fashion-dna/components/RecentlyInfluencedCard';
import { EvolutionTimelineCard } from '@/features/fashion-dna/components/EvolutionTimelineCard';
import { mergeFashionDna } from '@/features/fashion-dna/utils/merge-fashion-dna';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

function FashionDnaSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28 rounded bg-dashboard-surface" />
        <Skeleton className="h-10 w-72 rounded-xl bg-dashboard-surface" />
        <Skeleton className="h-4 w-56 rounded bg-dashboard-surface" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            key={`row1-${index}`}
            className="h-[420px] rounded-[24px] bg-dashboard-surface"
          />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={`row2-${index}`}
            className="h-[380px] rounded-[24px] bg-dashboard-surface"
          />
        ))}
      </div>
    </div>
  );
}

function isUpdatedToday(updatedAt) {
  if (!updatedAt) {
    return false;
  }

  const updated = new Date(updatedAt);
  const today = new Date();

  return (
    updated.getFullYear() === today.getFullYear()
    && updated.getMonth() === today.getMonth()
    && updated.getDate() === today.getDate()
  );
}

export function FashionDnaView() {
  const { data, isLoading } = useFashionDnaQuery();
  const dna = mergeFashionDna(data);

  if (isLoading) {
    return <FashionDnaSkeleton />;
  }

  const lastUpdatedLabel = isUpdatedToday(dna.updatedAt)
    ? 'Last updated today'
    : dna.updatedAt
      ? `Last updated ${new Date(dna.updatedAt).toLocaleDateString()}`
      : 'Awaiting first analysis';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#8B5CF6]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI ANALYSIS
          </p>
          <h2 className="text-3xl font-bold text-dashboard-foreground">
            Your Fashion DNA
          </h2>
          <p className="text-sm text-dashboard-muted">
            {lastUpdatedLabel}
            {dna.confidenceScore > 0 ? ` · Confidence score: ${dna.confidenceScore}/100` : ''}
          </p>
        </div>

        {dna.weeklyGrowth > 0 ? (
          <span
            className={cn(
              'inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/30',
              'bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400',
            )}
          >
            <TrendingUp className="size-3.5" aria-hidden="true" />
            +{dna.weeklyGrowth} pts this week
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <FashionConfidenceCard
          confidenceScore={dna.confidenceScore}
          fashionPersonality={dna.fashionPersonality}
          personalityDescription={dna.personalityDescription}
          isDefault={dna.isDefault}
        />
        <StyleRadarChart styleRadar={dna.styleRadar} />
        <ScoreHistoryChart historyTimeline={dna.historyTimeline} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StyleAttributesCard styleAttributes={dna.styleAttributes} />
        <ColorAffinityCard
          colorAffinity={dna.colorAffinity}
          colorProfile={dna.colorProfile}
          topColors={dna.topColors}
        />
        <BudgetRangeCard
          budgetRangeLabel={dna.budgetRangeLabel}
          budgetType={dna.budgetType}
          averageSpending={dna.averageSpending}
          spendProgress={dna.spendProgress}
        />
        <BrandAffinityCard
          brandAffinity={dna.brandAffinity}
          brandAffinityList={dna.brandAffinityList}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <AiFashionInsightsCard insights={dna.aiInsights} className="xl:col-span-2" />
        <ConfidenceBreakdownCard confidenceBreakdown={dna.confidenceBreakdown} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StyleEvolutionCard styleEvolution={dna.styleEvolution} />
        <WardrobeBalanceCard wardrobeBalance={dna.wardrobeBalance} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ShoppingInfluenceCard shoppingInfluence={dna.shoppingInfluence} />
        <SearchBehaviourCard searchBehaviour={dna.searchBehaviour} />
        <CurrentStyleMoodCard mood={dna.currentStyleMood} weeklyGrowth={dna.weeklyGrowth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <EvolutionTimelineCard
          historyTimeline={dna.historyTimeline}
          styleEvolution={dna.styleEvolution}
        />
        <FashionJourneyCard journey={dna.fashionJourney} />
      </div>

      <RecentlyInfluencedCard items={dna.recentlyInfluenced} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <DnaInsightCard
          title="Favorite Categories"
          icon={Grid3x3}
          items={dna.favoriteCategories}
          variant="chips"
        />
        <DnaInsightCard
          title="Shopping Behaviour"
          icon={ShoppingBag}
          items={dna.shoppingBehaviour}
        />
        <DnaInsightCard
          title="Wishlist Activity"
          icon={Heart}
          items={dna.wishlistActivity}
        />
        <DnaInsightCard
          title="Face Traits"
          icon={ScanFace}
          items={dna.faceTraits}
        />
        <DnaInsightCard
          title="Body Traits"
          icon={User}
          items={dna.bodyTraits}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DnaInsightCard
          title="Recommended Colors"
          icon={Palette}
          items={dna.recommendedColors}
          variant="chips"
        />
        <DnaInsightCard
          title="Recommended Fabrics"
          icon={Shirt}
          items={dna.recommendedFabrics}
          variant="chips"
        />
        <DnaInsightCard
          title="Brand Preferences"
          icon={Tag}
          items={dna.brandPreferences}
          variant="chips"
        />
        <DnaInsightCard
          title="Style Keywords"
          icon={Sparkles}
          items={dna.styleKeywords}
          variant="chips"
        />
      </div>
    </div>
  );
}
