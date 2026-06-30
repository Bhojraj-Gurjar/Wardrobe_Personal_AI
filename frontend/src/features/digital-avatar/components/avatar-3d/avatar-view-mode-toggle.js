'use client';

import { Box, Layers } from 'lucide-react';
import { cn } from '@/utils/cn';
import { AVATAR_VIEW_MODES } from '../../constants/avatar-3d.constants';

const MODES = [
  {
    id: AVATAR_VIEW_MODES.THREE_D,
    label: '3D',
    icon: Box,
  },
  {
    id: AVATAR_VIEW_MODES.TWO_D,
    label: '2D',
    icon: Layers,
  },
];

export function AvatarViewModeToggle({ value, onChange, className }) {
  return (
    <div
      className={cn(
        'inline-flex rounded-full border border-white/10 bg-[#0F172A]/90 p-1 shadow-lg backdrop-blur-sm',
        className,
      )}
      role="tablist"
      aria-label="Avatar preview mode"
    >
      {MODES.map(({ id, label, icon: Icon }) => {
        const active = value === id;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200',
              active
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                : 'bg-transparent text-white/65 hover:bg-white/5 hover:text-white',
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
