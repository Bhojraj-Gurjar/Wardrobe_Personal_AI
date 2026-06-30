'use client';

import { Shirt, Layers, Footprints, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';
import { CATEGORY_TABS } from '../constants/outfit-builder.constants';

const ICONS = {
  shirt: Shirt,
  jacket: Layers,
  pants: Minus,
  shoes: Footprints,
};

export function CategoryTabs({ activeCategory, onChange, className }) {
  return (
    <div
      className={cn(
        'mb-6 grid grid-cols-2 gap-2 rounded-[28px] border border-white/10 bg-[#111827] p-2 sm:grid-cols-5',
        className,
      )}
    >
      {CATEGORY_TABS.map((tab) => {
        const Icon = ICONS[tab.icon] || Shirt;
        const isActive = activeCategory === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange?.(tab.id)}
            className={cn(
              'inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2.5',
              'text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-[#0F172A] text-dashboard-muted hover:bg-white/5 hover:text-dashboard-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
