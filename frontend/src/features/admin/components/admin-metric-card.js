'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

function normalizeTrend(trend) {
  if (trend === undefined || trend === null) {
    return null;
  }

  if (typeof trend === 'object') {
    const value = Math.abs(Number(trend.value) || 0);
    if (value === 0) {
      return null;
    }

    return {
      value,
      direction: trend.direction === 'down' ? 'down' : 'up',
    };
  }

  const numeric = Number(trend);
  if (Number.isNaN(numeric) || numeric === 0) {
    return null;
  }

  return {
    value: Math.abs(numeric),
    direction: numeric >= 0 ? 'up' : 'down',
  };
}

export function AnimatedValue({ value, formatValue }) {
  const target = typeof value === 'number' ? value : Number(String(value).replace(/[^\d.-]/g, '')) || 0;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') {
      return;
    }

    const duration = 600;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(target * progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, value]);

  if (typeof value !== 'number') {
    return value;
  }

  return formatValue ? formatValue(display) : display;
}

export function AdminMetricCard({
  title,
  value,
  trend,
  icon: Icon,
  emoji,
  formatValue,
  className,
  highlight = false,
  active = false,
  onClick,
}) {
  const displayValue = formatValue && typeof value === 'number'
    ? formatValue(value)
    : value;
  const trendData = normalizeTrend(trend);
  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-dashboard-border bg-dashboard-surface p-5 text-left transition-all duration-300',
        onClick && 'interactive-card cursor-pointer hover:-translate-y-0.5 hover:border-primary/30',
        highlight && 'shadow-[0_0_28px_rgba(139,92,246,0.18)]',
        active && 'border-primary/50 bg-primary/10 shadow-[0_0_24px_rgba(139,92,246,0.2)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {Icon ? (
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </span>
        ) : emoji ? (
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-lg" aria-hidden="true">
            {emoji}
          </span>
        ) : null}
        {trendData ? (
          <span
            className={cn(
              'text-xs font-semibold',
              trendData.direction === 'up' && 'text-emerald-400',
              trendData.direction === 'down' && 'text-red-400',
            )}
          >
            {trendData.direction === 'up' ? '+' : '-'}
            {trendData.value}%
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-sm text-dashboard-muted">{title}</p>
      <p className="mt-1 text-2xl font-bold text-dashboard-foreground">
        {typeof value === 'number' ? (
          <AnimatedValue value={value} formatValue={formatValue} />
        ) : (
          displayValue
        )}
      </p>
    </Comp>
  );
}

export function AdminPageHeader({ label, title, description, action, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {label ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
            {label}
          </p>
        ) : null}
        <h2 className="text-2xl font-bold text-dashboard-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-dashboard-muted">{description}</p>
        ) : null}
      </div>
      {action || actions ? (
        <div className="shrink-0">{action || actions}</div>
      ) : null}
    </div>
  );
}
