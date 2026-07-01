'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { cn } from '@/utils/cn';
import { BRAND_PURPLE } from '@/constants/colors';

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

function normalizeSparkline(sparklineData = []) {
  if (!sparklineData.length) {
    return [];
  }

  return sparklineData.map((point, index) => {
    if (typeof point === 'number') {
      return { index, v: point };
    }

    return {
      index,
      v: Number(point?.v ?? point?.value ?? point?.revenue ?? point?.users ?? point?.orders ?? 0),
    };
  });
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

function MetricSparkline({ data }) {
  const chartData = normalizeSparkline(data);

  if (chartData.length < 2) {
    return <div className="h-10" aria-hidden="true" />;
  }

  return (
    <div className="h-10 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={BRAND_PURPLE}
            strokeWidth={2}
            dot={false}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const cardClassName = cn(
  'group relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-dashboard-surface/70 p-5 text-left',
  'shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-all duration-300',
  'before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-transparent before:opacity-0 before:transition-opacity',
  'hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_16px_48px_rgba(124,58,237,0.22)] hover:before:opacity-100',
);

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
  href,
  sparklineData,
  footerLabel = 'View Analytics →',
  showFooter = Boolean(href),
  compact = false,
}) {
  const displayValue = formatValue && typeof value === 'number'
    ? formatValue(value)
    : value;
  const trendData = normalizeTrend(trend);
  const isInteractive = Boolean(onClick || href);

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        {Icon ? (
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform duration-300 group-hover:scale-105">
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
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
              trendData.direction === 'up' && 'bg-emerald-500/15 text-emerald-400',
              trendData.direction === 'down' && 'bg-red-500/15 text-red-400',
            )}
          >
            {trendData.direction === 'up' ? (
              <ArrowUpRight className="size-3" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="size-3" aria-hidden="true" />
            )}
            {trendData.direction === 'up' ? '+' : '-'}
            {trendData.value}%
          </span>
        ) : null}
      </div>

      <p className={cn('text-sm text-dashboard-muted', compact ? 'mt-3' : 'mt-4')}>{title}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-dashboard-foreground">
        {typeof value === 'number' ? (
          <AnimatedValue value={value} formatValue={formatValue} />
        ) : (
          displayValue
        )}
      </p>

      {sparklineData?.length ? (
        <div className="mt-3 opacity-80 transition-opacity group-hover:opacity-100">
          <MetricSparkline data={sparklineData} />
        </div>
      ) : null}

      {showFooter && href ? (
        <p className="mt-3 text-xs font-medium text-primary/80 transition-colors group-hover:text-primary">
          {footerLabel}
        </p>
      ) : null}
    </>
  );

  const classes = cn(
    cardClassName,
    isInteractive && 'cursor-pointer',
    highlight && 'shadow-[0_0_28px_rgba(139,92,246,0.18)]',
    active && 'border-primary/50 bg-primary/10 shadow-[0_0_24px_rgba(139,92,246,0.2)]',
    className,
  );

  if (href) {
    return (
      <motion.div whileTap={{ scale: 0.98 }} className="h-full">
        <Link href={href} className={cn(classes, 'block h-full')}>
          {inner}
        </Link>
      </motion.div>
    );
  }

  if (onClick) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        className={classes}
      >
        {inner}
      </motion.button>
    );
  }

  return <div className={classes}>{inner}</div>;
}

export function AdminPageHeader({ label, title, description, action, actions, breadcrumb }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {breadcrumb}
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
