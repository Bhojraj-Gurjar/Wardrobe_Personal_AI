'use client';

import { Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';
import {
  fashionDnaCardHeaderGapClass,
  fashionDnaCardShell,
  fashionDnaCardTitleClass,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

const ATTRIBUTE_ORDER = [
  'Fit Preference',
  'Color Boldness',
  'Pattern Preference',
  'Formalness',
  'Brand Orientation',
  'Trend Adoption',
  'Seasonal Adaptability',
  'Experimentation Score',
];

const BAR_COLORS = [
  'bg-[#8B5CF6]',
  'bg-[#6366F1]',
  'bg-[#8B5CF6]',
  'bg-[#6366F1]',
  'bg-[#8B5CF6]',
  'bg-[#6366F1]',
  'bg-[#8B5CF6]',
  'bg-[#6366F1]',
];

export function StyleAttributesCard({ styleAttributes, className }) {
  const fitLabel = styleAttributes?.fitPreferenceLabel;

  const items = ATTRIBUTE_ORDER.map((label, index) => ({
    label,
    value: Math.round(Number(styleAttributes?.[label]) || 0),
    barColor: BAR_COLORS[index],
    hint: label === 'Fit Preference' && fitLabel ? fitLabel : null,
  })).filter((item) => item.value > 0);

  return (
    <section className={fashionDnaCardShell(className)}>
      <div className={cn('flex items-center gap-2', fashionDnaCardHeaderGapClass)}>
        <Zap className="size-4 text-[#8B5CF6]" aria-hidden="true" />
        <h3 className={fashionDnaCardTitleClass}>Style Attributes</h3>
      </div>

      {items.length ? (
        <div className="space-y-3 md:space-y-5">
          {items.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-dashboard-foreground">{item.label}</span>
                  {item.hint ? (
                    <p className="text-[11px] text-dashboard-muted">{item.hint}</p>
                  ) : null}
                </div>
                <span className="font-semibold text-dashboard-foreground">
                  {item.value}%
                </span>
              </div>
              <Progress
                value={item.value}
                indicatorClassName={item.barColor}
                className="h-2"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-dashboard-muted md:text-sm">
          Style attributes appear once you browse, save, or purchase products.
        </p>
      )}
    </section>
  );
}
