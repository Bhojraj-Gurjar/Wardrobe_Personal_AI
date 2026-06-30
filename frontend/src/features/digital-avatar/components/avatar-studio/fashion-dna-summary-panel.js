'use client';

import { Dna, Palette, Sparkles, Tag } from 'lucide-react';
import { cn } from '@/utils/cn';

function TraitChip({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-dashboard-foreground">
      {children}
    </span>
  );
}

export function FashionDnaSummaryPanel({
  generationProfile,
  stylePreferences,
  fashionDna,
  totalValue,
  className,
}) {
  const personality =
    generationProfile?.fashionPersonality
    || stylePreferences?.fashionPersonality
    || fashionDna?.fashionPersonality;

  const styleType =
    generationProfile?.styleArchetype
    || stylePreferences?.styleType
    || fashionDna?.styleType;

  const colors =
    generationProfile?.favoriteColors?.length
      ? generationProfile.favoriteColors
      : stylePreferences?.favoriteColors || [];

  const brands = generationProfile?.favoriteBrands || [];

  return (
    <div
      className={cn(
        'rounded-[24px] border border-white/10 bg-gradient-to-br from-[#141c28]/95 via-[#121820] to-[#0f141c]/95 p-5',
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <Dna className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-dashboard-foreground">Fashion DNA Summary</h3>
      </div>

      <div className="space-y-4 text-sm">
        {personality ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-dashboard-muted">Style personality</p>
            <p className="mt-1 font-semibold text-dashboard-foreground">{personality}</p>
          </div>
        ) : null}

        {styleType ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-dashboard-muted">Style direction</p>
            <p className="mt-1 font-semibold capitalize text-dashboard-foreground">
              {String(styleType).replace(/_/g, ' ')}
            </p>
          </div>
        ) : null}

        {generationProfile?.budgetType ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-dashboard-muted">Budget profile</p>
            <p className="mt-1 font-semibold text-dashboard-foreground">{generationProfile.budgetType}</p>
          </div>
        ) : null}

        {colors.length ? (
          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-dashboard-muted">
              <Palette className="size-3.5" />
              Favorite colors
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.slice(0, 6).map((color) => (
                <TraitChip key={color}>{color}</TraitChip>
              ))}
            </div>
          </div>
        ) : null}

        {brands.length ? (
          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-dashboard-muted">
              <Tag className="size-3.5" />
              Brand affinity
            </p>
            <div className="flex flex-wrap gap-2">
              {brands.slice(0, 5).map((brand) => (
                <TraitChip key={brand}>{brand}</TraitChip>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-primary/80">Current outfit value</p>
          <p className="mt-1 text-2xl font-bold text-dashboard-foreground">
            ${Number(totalValue || 0).toLocaleString()}
          </p>
        </div>

        {generationProfile?.defaultOutfitBlueprint ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-dashboard-muted">
              <Sparkles className="size-3.5 text-primary" />
              Default look
            </p>
            <p className="mt-1 text-sm text-dashboard-foreground">
              {generationProfile.defaultOutfitBlueprint.label}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
