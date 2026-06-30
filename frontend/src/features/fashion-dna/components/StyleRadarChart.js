'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/utils/cn';

const RADAR_AXES = [
  'Minimalist',
  'Classic',
  'Streetwear',
  'Formal',
  'Casual',
  'Avant-garde',
  'Athleisure',
  'Luxury',
];

function buildChartData(styleRadar) {
  return RADAR_AXES.map((axis) => ({
    axis,
    value: Math.round(Number(styleRadar?.[axis]) || 0),
  }));
}

export function StyleRadarChart({ styleRadar, className }) {
  const chartData = buildChartData(styleRadar);
  const hasData = chartData.some((entry) => entry.value > 0);

  return (
    <section
      className={cn(
        'flex h-full flex-col rounded-[24px] border border-dashboard-border',
        'bg-[#1A2235] p-6 shadow-lg',
        className,
      )}
    >
      <h3 className="text-base font-semibold text-dashboard-foreground">
        Style Profile Radar
      </h3>
      <p className="mt-1 text-xs text-dashboard-muted">
        Derived from views, wishlist, closet, purchases, and try-ons
      </p>

      <div className="mt-2 min-h-[280px] flex-1">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={280}>
            <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="72%">
              <PolarGrid stroke="rgba(255,255,255,0.12)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                dataKey="value"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.35}
                strokeWidth={2}
                isAnimationActive
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-dashboard-muted">
            Add shopping activity to generate your style radar.
          </div>
        )}
      </div>
    </section>
  );
}
