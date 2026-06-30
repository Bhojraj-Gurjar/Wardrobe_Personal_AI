'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';

const COLOR_HEX = {
  navy: '#1e3a5f',
  ecru: '#c9b99a',
  forest: '#2d5a3d',
  burgundy: '#6b2737',
  slate: '#64748b',
  white: '#f8fafc',
  black: '#111827',
  beige: '#d4c4a8',
  grey: '#94a3b8',
  gray: '#94a3b8',
  brown: '#7c4a2d',
  red: '#b91c1c',
  blue: '#2563eb',
  green: '#15803d',
  pink: '#db2777',
  purple: '#7c3aed',
  yellow: '#ca8a04',
  orange: '#ea580c',
  cream: '#f5f0e6',
  tan: '#c2a178',
  olive: '#556b2f',
  maroon: '#7f1d1d',
  teal: '#0f766e',
  charcoal: '#36454f',
};

function formatColorLabel(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveColorHex(colorKey) {
  const normalized = String(colorKey || '').trim().toLowerCase();
  return COLOR_HEX[normalized] || '#64748b';
}

function buildColorItems(colorAffinity, colorProfile, topColors) {
  if (colorProfile?.primary?.length) {
    return [
      ...(colorProfile.primary || []),
      ...(colorProfile.secondary || []),
    ].slice(0, 5).map((entry) => ({
      key: entry.key || entry.color,
      label: entry.color,
      percentage: entry.percentage,
      hex: resolveColorHex(entry.key || entry.color),
    }));
  }

  const entries = Object.entries(colorAffinity || {})
    .sort(([, left], [, right]) => right - left)
    .slice(0, 5);

  if (entries.length) {
    return entries.map(([key, weight]) => ({
      key,
      label: formatColorLabel(key),
      percentage: Math.round(Number(weight) * 100),
      hex: resolveColorHex(key),
    }));
  }

  return (topColors || []).slice(0, 5).map((color) => ({
    key: color,
    label: formatColorLabel(color),
    percentage: null,
    hex: resolveColorHex(color),
  }));
}

export function ColorAffinityCard({
  colorAffinity,
  colorProfile,
  topColors,
  className,
}) {
  const colors = buildColorItems(colorAffinity, colorProfile, topColors);
  const avoidColors = colorProfile?.avoid || [];

  return (
    <section
      className={cn(
        'flex h-full flex-col rounded-[24px] border border-dashboard-border',
        'bg-[#1A2235] p-6 shadow-lg',
        className,
      )}
    >
      <h3 className="text-base font-semibold text-dashboard-foreground">
        Color Affinity
      </h3>
      <p className="mt-1 text-xs text-dashboard-muted">
        From face analysis, closet, wishlist, and purchase signals
      </p>

      {colors.length ? (
        <>
          <div className="mt-5 grid grid-cols-5 gap-3">
            {colors.map((color) => (
              <div key={color.key} className="flex flex-col items-center gap-2 text-center">
                <span
                  className="size-12 rounded-full border border-white/10 shadow-inner"
                  style={{ backgroundColor: color.hex }}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-medium text-dashboard-foreground">
                    {color.label}
                  </p>
                  {color.percentage !== null ? (
                    <p className="text-[11px] text-dashboard-muted">{color.percentage}%</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {colors.filter((color) => color.percentage !== null).map((color) => (
              <div key={`bar-${color.key}`} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: color.hex }}
                      aria-hidden="true"
                    />
                    <span className="text-dashboard-foreground">{color.label}</span>
                  </div>
                  <span className="font-medium text-dashboard-foreground">
                    {color.percentage}%
                  </span>
                </div>
                <Progress value={color.percentage} className="h-1.5" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-5 text-sm text-dashboard-muted">
          Color affinity unlocks after product interactions and profile color preferences.
        </p>
      )}

      {avoidColors.length ? (
        <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-rose-300">Avoid</p>
          <p className="mt-1 text-sm text-dashboard-muted">{avoidColors.join(', ')}</p>
        </div>
      ) : null}
    </section>
  );
}
