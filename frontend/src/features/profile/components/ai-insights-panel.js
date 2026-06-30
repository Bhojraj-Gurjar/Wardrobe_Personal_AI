'use client';

import Link from 'next/link';
import { Lightbulb, ChevronRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ProfilePremiumCard } from '@/features/profile/components/profile-premium-card';
import { ProfileMotionGridItem } from '@/features/profile/components/profile-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function AIInsightsPanel({ insights = [], isLoading }) {
  const items = (insights || []).filter(Boolean).slice(0, 6);

  if (isLoading) {
    return (
      <ProfilePremiumCard title="AI Style Insights" className="animate-pulse">
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 rounded-2xl bg-white/5" />
          ))}
        </div>
      </ProfilePremiumCard>
    );
  }

  return (
    <ProfilePremiumCard
      title="AI Style Insights"
      description="Observations from your browsing, closet, and style signals"
      icon={Lightbulb}
      action={
        <Button variant="ghost" size="sm" asChild className="text-primary">
          <Link href={ROUTES.AI.FASHION_DNA}>
            All insights
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      }
    >
      {items.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((insight, index) => (
            <ProfileMotionGridItem key={insight} index={index}>
              <div
                className={cn(
                  'h-full rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-4',
                  'transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10',
                )}
              >
                <p className="text-sm leading-relaxed text-dashboard-foreground">
                  {insight}
                </p>
              </div>
            </ProfileMotionGridItem>
          ))}
        </div>
      ) : (
        <p className="text-sm text-dashboard-muted">
          Browse products, save looks, and build your closet to unlock personalized AI insights.
        </p>
      )}
    </ProfilePremiumCard>
  );
}
