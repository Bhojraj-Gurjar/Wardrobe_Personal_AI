'use client';

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/utils/cn';

export function EvolutionTimelineCard({
  historyTimeline = [],
  styleEvolution = [],
  className,
}) {
  const chartData = historyTimeline.length
    ? historyTimeline
    : styleEvolution.slice(0, 6).map((entry, index) => ({
      month: entry.axis || `Stage ${index + 1}`,
      score: entry.current || 0,
    }));

  return (
    <section
      className={cn(
        'rounded-[24px] border border-dashboard-border bg-[#1A2235] p-6',
        className,
      )}
    >
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-dashboard-foreground">Style Evolution Timeline</h3>
        <p className="text-sm text-dashboard-muted">
          Confidence growth and style shifts from your living profile
        </p>
      </div>

      {chartData.length ? (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: '#111827',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-dashboard-muted">
          Score tracking starts from your first Fashion DNA refresh.
        </p>
      )}

      {styleEvolution.length ? (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {styleEvolution.slice(0, 4).map((entry) => (
            <div
              key={entry.axis}
              className="flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-2 text-sm"
            >
              <span className="text-dashboard-foreground">{entry.axis}</span>
              <span className={entry.delta >= 0 ? 'text-emerald-400' : 'text-rose-300'}>
                {entry.delta >= 0 ? '+' : ''}{entry.delta}%
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
