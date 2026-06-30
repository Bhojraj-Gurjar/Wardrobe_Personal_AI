'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';
import {
  fashionDnaCardShell,
  fashionDnaCardSubtitleClass,
  fashionDnaCardTitleClass,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

function formatBrandName(key) {
  const normalized = String(key || '')
    .replace(/^brand[-_]/i, '')
    .replace(/[-_]/g, ' ')
    .trim();

  return normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildBrandItems(brandAffinity, brandAffinityList) {
  if (Array.isArray(brandAffinityList) && brandAffinityList.length) {
    return brandAffinityList;
  }

  const entries = Object.entries(brandAffinity || {}).filter(
    ([, weight]) => Number(weight) > 0,
  );

  if (entries.length) {
    return entries
      .sort(([, left], [, right]) => right - left)
      .slice(0, 6)
      .map(([key, weight]) => ({
        key,
        name: formatBrandName(key),
        percentage: Math.round(Number(weight) * 100),
      }));
  }

  return [];
}

export function BrandAffinityCard({ brandAffinity, brandAffinityList, className }) {
  const brands = buildBrandItems(brandAffinity, brandAffinityList);

  return (
    <section className={fashionDnaCardShell(className)}>
      <h3 className={fashionDnaCardTitleClass}>Brand Affinity</h3>
      <p className={fashionDnaCardSubtitleClass}>
        Only brands you viewed, saved, purchased, or added to closet
      </p>

      {brands.length ? (
        <div className="mt-3 space-y-3 md:mt-5 md:space-y-5">
          {brands.map((brand) => (
          <div key={brand.key || brand.name} className="space-y-2">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full',
                  'bg-dashboard-bg text-xs font-semibold text-dashboard-foreground',
                )}
                aria-hidden="true"
              >
                {brand.name?.charAt(0) || '?'}
              </span>
              <span className="flex-1 text-sm font-medium text-dashboard-foreground">
                {brand.name}
              </span>
              <span className="text-sm font-semibold text-dashboard-foreground">
                {brand.percentage}%
              </span>
            </div>
            <Progress value={brand.percentage} className="h-1.5" />
          </div>
        ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-dashboard-muted md:mt-5 md:text-sm">
          Brand affinity appears after you interact with products from specific labels.
        </p>
      )}
    </section>
  );
}
