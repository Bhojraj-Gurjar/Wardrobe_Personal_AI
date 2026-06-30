'use client';

import { cn } from '@/utils/cn';
import { AVATAR_3D_PRESETS } from '../../constants/avatar-3d.constants';

export function BodyTypeSelector({ value, onChange, className }) {
  return (
    <div className={cn('space-y-4', className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dashboard-muted">
        Body Type
      </p>
      <div className="grid grid-cols-2 gap-4">
        {AVATAR_3D_PRESETS.map((preset) => {
          const active = preset.id === value;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange?.(preset.id)}
              className={cn(
                'min-h-[88px] rounded-2xl border px-4 py-4 text-left transition-all duration-200',
                active
                  ? 'border-purple-500 bg-purple-600/20 shadow-lg shadow-purple-500/20'
                  : 'border-white/10 bg-[#0F172A] hover:border-white/20 hover:bg-[#131c31]',
              )}
            >
              <span className="block text-sm font-semibold text-white">
                {preset.label}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-white/55">
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
