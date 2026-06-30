'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { FACE_DASHBOARD_CARD_CLASS } from '../constants/face-analysis-dashboard';

export function FaceStyleRecommendationsCard({ recommendations, className }) {
  return (
    <Card className={cn(FACE_DASHBOARD_CARD_CLASS, className)}>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-dashboard-foreground">
          Style Recommendations Based on Face Analysis
        </h3>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((item) => (
            <div
              key={item.id}
              className={cn(
                'rounded-2xl border px-4 py-4 text-sm leading-relaxed',
                item.enabled
                  ? 'border-white/8 bg-[#12182A]/80 text-dashboard-foreground'
                  : 'border-white/5 bg-[#12182A]/40 text-dashboard-muted opacity-60',
              )}
            >
              <span className="mr-2 text-[#8B5CF6]">•</span>
              {item.text}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
