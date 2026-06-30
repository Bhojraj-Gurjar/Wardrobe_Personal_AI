'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import {
  fashionDnaCardShell,
  fashionDnaCardSubtitleClass,
  fashionDnaCardTitleClass,
  fashionDnaChartEmptyClass,
  fashionDnaChartWrapClass,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

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
    <section className={fashionDnaCardShell(className)}>
      <h3 className={fashionDnaCardTitleClass}>Style Profile Radar</h3>
      <p className={fashionDnaCardSubtitleClass}>
        Derived from views, wishlist, closet, purchases, and try-ons
      </p>

      <div className={fashionDnaChartWrapClass}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
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
          <div className={fashionDnaChartEmptyClass}>
            Add shopping activity to generate your style radar.
          </div>
        )}
      </div>
    </section>
  );
}
