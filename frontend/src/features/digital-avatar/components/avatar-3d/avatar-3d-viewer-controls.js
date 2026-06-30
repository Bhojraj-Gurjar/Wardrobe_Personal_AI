'use client';

import { Minus, Plus, RotateCcw } from 'lucide-react';
import { cn } from '@/utils/cn';

function ControlButton({ label, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex size-12 items-center justify-center rounded-full border border-white/10',
        'bg-[#0F172A]/95 text-white/90 shadow-lg backdrop-blur-sm',
        'transition-all duration-200 hover:border-purple-500/40 hover:bg-purple-600/20 hover:text-white',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Avatar3DViewerControls({
  onZoomIn,
  onZoomOut,
  onReset,
  className,
}) {
  return (
    <div
      className={cn(
        'pointer-events-auto flex flex-col gap-2.5',
        className,
      )}
    >
      <ControlButton label="Zoom in" onClick={onZoomIn}>
        <Plus className="size-5" />
      </ControlButton>
      <ControlButton label="Zoom out" onClick={onZoomOut}>
        <Minus className="size-5" />
      </ControlButton>
      <ControlButton label="Reset view" onClick={onReset}>
        <RotateCcw className="size-4" />
      </ControlButton>
    </div>
  );
}
