'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/utils/cn';

function HistoryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-dashboard-border bg-[#1A2235] px-3 py-2 text-sm shadow-lg">
      <p className="text-dashboard-muted">{label}</p>
      <p className="font-semibold text-dashboard-foreground">
        Score {payload[0]?.value}
      </p>
    </div>
  );
}

export function ScoreHistoryChart({ historyTimeline, className }) {
  const chartData = (historyTimeline || [])
    .filter((point) => point.score !== null && point.score !== undefined)
    .map((point) => ({
      month: point.month,
      score: Math.round(Number(point.score) || 0),
    }));

  const minScore = chartData.length
    ? Math.max(0, Math.min(...chartData.map((point) => point.score)) - 10)
    : 0;
  const maxScore = chartData.length
    ? Math.min(100, Math.max(...chartData.map((point) => point.score)) + 10)
    : 100;

  return (
    <section
      className={cn(
        'flex h-full flex-col rounded-[24px] border border-dashboard-border',
        'bg-[#1A2235] p-6 shadow-lg',
        className,
      )}
    >
      <div>
        <h3 className="text-base font-semibold text-dashboard-foreground">
          Score Over Time
        </h3>
        <p className="mt-1 text-xs text-dashboard-muted">Monthly Fashion DNA snapshots</p>
      </div>

      <div className="mt-4 min-h-[280px] flex-1">
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[minScore, maxScore]}
                tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<HistoryTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#8B5CF6' }}
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-dashboard-muted">
            Score tracking starts from your first Fashion DNA refresh.
          </div>
        )}
      </div>
    </section>
  );
}
