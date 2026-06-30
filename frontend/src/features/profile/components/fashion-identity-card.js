'use client';

import Link from 'next/link';
import { Fingerprint, ChevronRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import {
  ProfileIdentityRow,
  ProfilePremiumCard,
} from '@/features/profile/components/profile-premium-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

function ColorSwatches({ colors }) {
  if (!colors?.length) {
    return <p className="text-sm text-dashboard-muted">Add color preferences</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {colors.map((color) => (
        <span
          key={color}
          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-dashboard-foreground"
        >
          {color}
        </span>
      ))}
    </div>
  );
}

function BrandList({ brands }) {
  if (!brands?.length) {
    return <p className="text-sm text-dashboard-muted">No brands selected yet</p>;
  }

  return (
    <p className="text-sm font-semibold text-dashboard-foreground">
      {brands.join(' · ')}
    </p>
  );
}

export function FashionIdentityCard({ identity, isLoading }) {
  if (isLoading) {
    return (
      <ProfilePremiumCard title="Fashion Identity" className="animate-pulse">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-16 rounded-xl bg-white/5" />
          ))}
        </div>
      </ProfilePremiumCard>
    );
  }

  const rows = [
    { label: 'Style Personality', value: identity?.stylePersonality },
    { label: 'Fashion DNA Score', value: identity?.fashionDnaScore ? String(identity.fashionDnaScore) : null },
    { label: 'Body Type', value: identity?.bodyType },
    { label: 'Face Shape', value: identity?.faceShape },
    { label: 'Budget Profile', value: identity?.budgetProfile },
  ];

  return (
    <ProfilePremiumCard
      title="Fashion Identity"
      description="Your AI-curated style fingerprint"
      icon={Fingerprint}
      action={
        <Button variant="ghost" size="sm" asChild className="text-primary">
          <Link href={ROUTES.AI.FASHION_DNA}>
            View DNA
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className={cn(
              'rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4',
              'transition-colors hover:border-primary/25 hover:bg-white/[0.05]',
            )}
          >
            <ProfileIdentityRow label={row.label} value={row.value} />
          </div>
        ))}

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 sm:col-span-2 lg:col-span-1">
          <ProfileIdentityRow label="Color Palette">
            <ColorSwatches colors={identity?.colorPalette} />
          </ProfileIdentityRow>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 sm:col-span-2">
          <ProfileIdentityRow label="Preferred Brands">
            <BrandList brands={identity?.preferredBrands} />
          </ProfileIdentityRow>
        </div>
      </div>
    </ProfilePremiumCard>
  );
}
