'use client';

import {
  CalendarHeart,
  Package,
  ScanFace,
  Sparkles,
  UserRound,
  Wand2,
} from 'lucide-react';
import { ProfilePremiumCard } from '@/features/profile/components/profile-premium-card';
import { cn } from '@/utils/cn';

const ICON_MAP = {
  sparkles: Sparkles,
  scan: ScanFace,
  body: UserRound,
  avatar: Wand2,
  outfit: CalendarHeart,
  order: Package,
  tryon: ScanFace,
};

export function FashionJourney({ events = [], isLoading }) {
  if (isLoading) {
    return (
      <ProfilePremiumCard title="Fashion Journey" className="animate-pulse">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 rounded-xl bg-white/5" />
          ))}
        </div>
      </ProfilePremiumCard>
    );
  }

  return (
    <ProfilePremiumCard
      title="Fashion Journey"
      description="Milestones on your Wardrobe AI path"
      icon={CalendarHeart}
    >
      {events.length ? (
        <ol className="relative space-y-0">
          {events.map((event, index) => {
            const Icon = ICON_MAP[event.icon] || Sparkles;
            const isLast = index === events.length - 1;

            return (
              <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-[17px] top-9 h-[calc(100%-12px)] w-px bg-gradient-to-b from-primary/50 to-transparent"
                  />
                ) : null}

                <div
                  className={cn(
                    'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full',
                    'border border-primary/30 bg-primary/15 text-primary',
                  )}
                >
                  <Icon className="size-4" />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-semibold text-dashboard-foreground">
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-xs text-dashboard-muted">{event.dateLabel}</p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-dashboard-muted">
          Complete face analysis, build your closet, and try on outfits to start your journey timeline.
        </p>
      )}
    </ProfilePremiumCard>
  );
}
