'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function AISuggestButton({ onClick, isLoading = false, className }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        'h-12 w-full rounded-2xl bg-[#8B5CF6] text-white hover:bg-[#7C3AED]',
        className,
      )}
    >
      {isLoading ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 size-4" />
      )}
      AI Suggest Complete Outfit
    </Button>
  );
}
