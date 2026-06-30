'use client';

import { cn } from '@/utils/cn';
import { HAIR_COLOR_OPTIONS } from '../constants/outfit-builder.constants';

export function HairColorSelector({ value, onChange, className, size = 'lg' }) {
  const circleSize = size === 'lg' ? 'size-12' : 'size-8';

  return (
    <div className={cn('space-y-4', className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dashboard-muted">
        Hair Color
      </p>
      <div className="flex flex-wrap gap-3">
        {HAIR_COLOR_OPTIONS.map((option) => {
          const isActive = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              aria-label={option.label}
              aria-pressed={isActive}
              onClick={() => onChange?.(option.id)}
              className={cn(
                circleSize,
                'rounded-full border-2 transition-all duration-200',
                isActive
                  ? 'scale-110 border-purple-500 ring-4 ring-purple-500/40'
                  : 'border-white/10 hover:scale-105 hover:border-white/30',
              )}
              style={{ backgroundColor: option.color }}
            />
          );
        })}
      </div>
    </div>
  );
}
