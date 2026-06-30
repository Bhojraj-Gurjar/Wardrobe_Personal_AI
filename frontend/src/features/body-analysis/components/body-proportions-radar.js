'use client';

import { useEffect, useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { BODY_DASHBOARD_CARD_CLASS, BODY_EMPTY_ANALYSIS_MESSAGE } from '../constants/body-analysis-dashboard';

export function BodyProportionsRadar({ radarData, hasAnalysis, className }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = Array.isArray(radarData) ? radarData : [];
  const showChart = hasAnalysis && chartData.length > 0;

  return (
    <Card className={cn(BODY_DASHBOARD_CARD_CLASS, 'h-full', className)}>
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-semibold text-dashboard-foreground">
          Body Proportions
        </CardTitle>
        <CardDescription className="text-dashboard-muted">
          Compared to typical adult proportions
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4 pt-2">
        <div className="flex min-h-[320px] w-full items-center justify-center">
          {!showChart ? (
            <p className="px-6 text-center text-sm text-dashboard-muted">
              {BODY_EMPTY_ANALYSIS_MESSAGE}
            </p>
          ) : mounted ? (
            <RadarChart
              width={320}
              height={320}
              data={chartData}
              cx="50%"
              cy="52%"
              outerRadius="72%"
            >
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }}
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
                fillOpacity={0.32}
                strokeWidth={2}
              />
            </RadarChart>
          ) : (
            <div className="h-[320px] w-full max-w-[320px] animate-pulse rounded-2xl bg-dashboard-surface-elevated" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
