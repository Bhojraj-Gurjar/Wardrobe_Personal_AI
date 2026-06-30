'use client';

import { Download, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { AISuggestButton } from './ai-suggest-button';

export function AvatarControls({
  onExport,
  onCompare,
  compareMode = false,
  onSuggest,
  isSuggesting = false,
  className,
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          className="h-11 rounded-2xl border-white/10 bg-[#0B1020] text-dashboard-foreground hover:bg-[#8B5CF6]/10"
        >
          <Download className="mr-2 size-4" />
          Export PNG
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCompare}
          className={cn(
            'h-11 rounded-2xl border-white/10 bg-[#0B1020] text-dashboard-foreground hover:bg-[#8B5CF6]/10',
            compareMode && 'border-[#8B5CF6]/50 bg-[#8B5CF6]/10',
          )}
        >
          <GitCompare className="mr-2 size-4" />
          Compare
        </Button>
      </div>

      <AISuggestButton onClick={onSuggest} isLoading={isSuggesting} />
    </div>
  );
}
