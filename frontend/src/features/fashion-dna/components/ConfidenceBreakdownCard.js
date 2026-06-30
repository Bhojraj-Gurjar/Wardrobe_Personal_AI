'use client';

import { Progress } from '@/components/ui/progress';
import {
  fashionDnaCardShell,
  fashionDnaCardSubtitleClass,
  fashionDnaCardTitleClass,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

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
    <section className={fashionDnaCardShell(className)}>
      <h3 className={fashionDnaCardTitleClass}>DNA Confidence Breakdown</h3>
      <p className={fashionDnaCardSubtitleClass}>
        Weighted from face, body, closet, purchases, and engagement signals
      </p>

      <div className="mt-3 space-y-3 md:mt-5 md:space-y-4">
        {entries.map((entry) => (
          <div key={entry.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs md:text-sm">
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
