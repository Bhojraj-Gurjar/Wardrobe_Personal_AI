'use client';

import Link from 'next/link';
import { Activity, ChevronRight } from 'lucide-react';
import { ProfilePremiumCard } from '@/features/profile/components/profile-premium-card';
import { AnimatedProgressBar } from '@/features/profile/components/profile-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

function HealthRow({ item, index }) {
  const content = (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4',
        'transition-all hover:border-primary/25 hover:bg-white/[0.05]',
        item.href && 'cursor-pointer',
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-dashboard-foreground">{item.label}</p>
        <span className="text-sm font-bold text-primary">{item.percent}%</span>
      </div>
      <AnimatedProgressBar
        percent={item.percent}
        barClassName="h-1.5 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa]"
      />
    </div>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export function PersonalizationHealth({ items = [], isLoading }) {
  if (isLoading) {
    return (
      <ProfilePremiumCard title="AI Personalization Health" className="animate-pulse">
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-20 rounded-2xl bg-white/5" />
          ))}
        </div>
      </ProfilePremiumCard>
    );
  }

  return (
    <ProfilePremiumCard
      title="AI Personalization Health"
      description="How complete your AI style profile is across Wardrobe AI"
      icon={Activity}
      action={
        <Button variant="ghost" size="sm" asChild className="text-primary">
          <Link href="/face-analysis">
            Improve profile
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <HealthRow key={item.id} item={item} index={index} />
        ))}
      </div>
    </ProfilePremiumCard>
  );
}
