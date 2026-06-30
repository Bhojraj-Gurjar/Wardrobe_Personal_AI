'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';

const LABELS = {
  faceAnalysis: 'Face Analysis',
  bodyAnalysis: 'Body Analysis',
  preferenceCompleteness: 'Preferences',
  closetData: 'Closet Data',
  purchaseHistory: 'Purchase History',
  wishlistActivity: 'Wishlist Activity',
  tryOnUsage: 'Try-On Usage',
  stylistInteractions: 'Stylist Chats',
  fashionConsistency: 'Style Consistency',
};

export function ConfidenceBreakdownCard({ confidenceBreakdown, className }) {
  const components = confidenceBreakdown?.components || {};
  const entries = Object.entries(LABELS)
    .map(([key, label]) => ({
      key,
      label,
      value: Math.round(Number(components[key]) || 0),
      weight: confidenceBreakdown?.weights?.[key] || null,
    }))
    .filter((entry) => entry.value > 0);

  if (!entries.length) {
    return null;
  }

  return (
    <section
      className={cn(
        'rounded-[24px] border border-dashboard-border bg-[#1A2235] p-6 shadow-lg',
        className,
      )}
    >
      <h3 className="text-base font-semibold text-dashboard-foreground">
        DNA Confidence Breakdown
      </h3>
      <p className="mt-1 text-xs text-dashboard-muted">
        Weighted from face, body, closet, purchases, and engagement signals
      </p>

      <div className="mt-5 space-y-4">
        {entries.map((entry) => (
          <div key={entry.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-dashboard-foreground">{entry.label}</span>
              <span className="font-semibold text-dashboard-foreground">{entry.value}%</span>
            </div>
            <Progress value={entry.value} className="h-1.5" />
          </div>
        ))}
      </div>
    </section>
  );
}
