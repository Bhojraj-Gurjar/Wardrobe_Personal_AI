'use client';

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  fashionDnaCardShell,
  fashionDnaCardSubtitleClass,
  fashionDnaCardTitleClass,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

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
    <section className={fashionDnaCardShell(className)}>
      <div className="mb-3 md:mb-5">
        <h3 className={fashionDnaCardTitleClass}>Style Evolution Timeline</h3>
        <p className={fashionDnaCardSubtitleClass}>
          Confidence growth and style shifts from your living profile
        </p>
      </div>

      {chartData.length ? (
        <div className="h-[200px] w-full md:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="month" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
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
        <p className="text-xs text-dashboard-muted md:text-sm">
          Score tracking starts from your first Fashion DNA refresh.
        </p>
      )}

      {styleEvolution.length ? (
        <div className="mt-3 grid gap-1.5 sm:grid-cols-2 md:mt-5 md:gap-2">
          {styleEvolution.slice(0, 4).map((entry) => (
            <div
              key={entry.axis}
              className="flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-1.5 text-xs md:py-2 md:text-sm"
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
