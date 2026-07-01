'use client';

import { useCallback } from 'react';
import { Download, Printer, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { showToast } from '@/stores/toast-store';

export const ANALYTICS_PERIOD_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'Last 7 Days' },
  { id: 'month', label: 'Last 30 Days' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'year', label: 'Year' },
];

export function AdminAnalyticsPeriodFilters({ value, onChange, options = ANALYTICS_PERIOD_OPTIONS, className }) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
            value === option.id
              ? 'border-primary/50 bg-primary/15 text-primary shadow-[0_0_16px_rgba(124,58,237,0.2)]'
              : 'border-white/[0.08] bg-white/[0.03] text-dashboard-muted hover:border-primary/30 hover:text-dashboard-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function downloadCsv(filename, rows) {
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminAnalyticsToolbar({
  onRefresh,
  isRefreshing = false,
  exportRows,
  exportFilename = 'analytics-export.csv',
  className,
}) {
  const handleExportCsv = useCallback(() => {
    if (!exportRows?.length) {
      showToast('No data to export for the selected filters', 'error');
      return;
    }

    downloadCsv(exportFilename, exportRows);
    showToast('Report exported successfully', 'success');
  }, [exportFilename, exportRows]);

  const handlePrint = useCallback(() => {
    window.print();
    showToast('Print dialog opened', 'success');
  }, []);

  const handleRefresh = useCallback(() => {
    onRefresh?.();
    showToast('Analytics refreshed', 'success');
  }, [onRefresh]);

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Button type="button" variant="glass" size="sm" onClick={handleExportCsv}>
        <Download className="mr-2 size-4" />
        Export CSV
      </Button>
      <Button type="button" variant="glass" size="sm" onClick={handlePrint}>
        <Printer className="mr-2 size-4" />
        Print
      </Button>
      <Button
        type="button"
        variant="glass"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={cn('mr-2 size-4', isRefreshing && 'animate-spin')} />
        Refresh
      </Button>
    </div>
  );
}
