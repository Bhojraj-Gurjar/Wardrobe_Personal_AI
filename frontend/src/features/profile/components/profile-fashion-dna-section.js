'use client';

import Link from 'next/link';
import { Dna } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useFashionDnaQuery } from '@/features/fashion-dna/hooks';
import { mergeFashionDna } from '@/features/fashion-dna/utils/merge-fashion-dna';
import {
  ProfileDetailCard,
  ProfileDetailRow,
} from '@/features/profile/components/profile-detail-card';
import { Button } from '@/components/ui/button';

export function ProfileFashionDnaSection() {
  const { data, isLoading } = useFashionDnaQuery();
  const fashionDna = mergeFashionDna(data);

  const rows = [
    { label: 'Style Type', value: fashionDna.fashionPersonality || fashionDna.styleType },
    {
      label: 'Colour Palette',
      value: fashionDna.recommendedColors?.slice(0, 4).join(', '),
    },
    { label: 'Budget Range', value: fashionDna.budgetRangeLabel },
    {
      label: 'Favourite Brands',
      value: fashionDna.brandPreferences?.slice(0, 4).join(', '),
    },
  ].filter((row) => row.value);

  return (
    <ProfileDetailCard
      title="Style Profile"
      description="AI-generated style summary from your face and body analysis."
      action={
        <Button variant="ghost" size="sm" asChild className="text-primary">
          <Link href={ROUTES.AI.FASHION_DNA}>
            <Dna className="size-4" />
            Open Fashion DNA
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <p className="py-4 text-sm text-dashboard-muted">Loading Fashion DNA…</p>
      ) : fashionDna.hasData && rows.length ? (
        rows.map((row) => (
          <ProfileDetailRow key={row.label} label={row.label} value={row.value} />
        ))
      ) : (
        <p className="py-4 text-sm text-dashboard-muted">
          Complete face and body analysis to generate your Fashion DNA profile.
        </p>
      )}
    </ProfileDetailCard>
  );
}
