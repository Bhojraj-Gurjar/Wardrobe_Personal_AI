'use client';

import { cn } from '@/utils/cn';

export function ProfilePremiumCard({
  id,
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
  variant = 'default',
}) {
  return (
    <section
      id={id}
      className={cn(
        'interactive-card relative overflow-hidden rounded-[24px] border border-white/[0.08]',
        'shadow-[0_20px_60px_-24px_rgba(109,40,217,0.35)] backdrop-blur-xl',
        variant === 'hero'
          ? 'bg-gradient-to-r from-[#1a1030]/95 via-[#12121f]/95 to-[#0c0f18]/95 p-6 sm:p-7'
          : 'bg-gradient-to-br from-[#141c28]/95 via-[#121820] to-[#0f141c]/95 p-6',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0',
          variant === 'hero'
            ? 'bg-[radial-gradient(ellipse_at_top_left,rgba(109,40,217,0.22),transparent_55%)]'
            : 'bg-[radial-gradient(ellipse_at_top_right,rgba(109,40,217,0.12),transparent_50%)]',
        )}
      />

      <div className="relative">
        {(title || description || action) ? (
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              {Icon ? (
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </div>
              ) : null}
              {title ? (
                <h2 className="text-lg font-bold tracking-tight text-dashboard-foreground">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-1 text-sm text-dashboard-muted">{description}</p>
              ) : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        ) : null}

        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
}

export function ProfileSectionLabel({ children, className }) {
  return (
    <p
      className={cn(
        'text-xs font-semibold uppercase tracking-[0.14em] text-primary/80',
        className,
      )}
    >
      {children}
    </p>
  );
}

export function ProfileIdentityRow({ label, value, children }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-dashboard-muted">
        {label}
      </p>
      {children ?? (
        <p className="text-sm font-semibold text-dashboard-foreground">
          {value || '—'}
        </p>
      )}
    </div>
  );
}

export function ProfileProgressRing({
  percent,
  size = 56,
  strokeWidth = 4,
  className,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className={cn('-rotate-90', className)}
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#8B5CF6"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  );
}
