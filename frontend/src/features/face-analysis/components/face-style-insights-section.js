'use client';

import {
  Eye,
  Palette,
  Shirt,
  Sparkles,
  Sun,
  Watch,
  Wind,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { FACE_DASHBOARD_CARD_CLASS } from '../constants/face-analysis-dashboard';

const SECTION_ICONS = {
  colors: Palette,
  necklines: Shirt,
  tops: Shirt,
  outerwear: Wind,
  accessories: Watch,
  eyewear: Eye,
  outfits: Sparkles,
};

export function FaceStyleInsightsSection({ styleInsights, className }) {
  const sections = styleInsights?.sections || [];

  if (!sections.length) {
    return null;
  }

  return (
    <section className={cn('space-y-5', className)}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sun className="size-5 text-[#A78BFA]" aria-hidden="true" />
          <h2 className="text-2xl font-bold tracking-tight text-dashboard-foreground">
            Style Insights
          </h2>
        </div>
        <p className="text-sm text-dashboard-muted">
          Personalized from your analyzed face shape, skin tone, hair, and grooming — not generic tips.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const Icon = SECTION_ICONS[section.id] || Sparkles;

          return (
            <Card
              key={section.id}
              className={cn(FACE_DASHBOARD_CARD_CLASS, 'h-full')}
            >
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#A78BFA]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-dashboard-foreground">
                      {section.title}
                    </h3>
                    {section.subtitle ? (
                      <p className="mt-1 text-xs text-dashboard-muted">{section.subtitle}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/8 bg-[#12182A]/80 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-[#DDD6FE]">{item.title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-dashboard-foreground">
                        {item.recommendation}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-violet-300/85">
                        {item.why}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
