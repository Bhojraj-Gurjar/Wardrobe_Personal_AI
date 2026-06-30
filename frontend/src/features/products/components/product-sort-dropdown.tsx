'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  getSortOption,
  PRODUCT_SORT_OPTIONS,
  type ProductSortId,
} from '@/features/products/constants/sort-options';

type ProductSortDropdownProps = {
  value: ProductSortId | string;
  onChange: (value: ProductSortId) => void;
  className?: string;
};

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [breakpoint]);

  return isMobile;
}

function SortOptionRow({
  option,
  selected,
  onSelect,
  className,
}: {
  option: (typeof PRODUCT_SORT_OPTIONS)[number];
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  const Icon = option.Icon;

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-lg px-3 text-left transition-all duration-200',
        'min-h-11 md:min-h-10',
        selected
          ? 'bg-primary text-primary-foreground'
          : 'text-dashboard-muted hover:bg-white/[0.06] hover:text-dashboard-foreground',
        className,
      )}
    >
      <span
        className={cn(
          'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity duration-200',
          !selected && 'group-hover:opacity-100',
          selected && 'opacity-0',
        )}
        aria-hidden="true"
      />
      <Icon className={cn('size-4 shrink-0', selected ? 'text-primary-foreground' : 'text-dashboard-muted group-hover:text-dashboard-foreground')} />
      <span className="flex-1 text-[14px] font-medium tracking-wide">{option.label}</span>
      {selected ? <Check className="size-4 shrink-0" aria-hidden="true" /> : null}
    </button>
  );
}

function MobileSortSheet({
  value,
  onChange,
  open,
  onOpenChange,
}: {
  value: string;
  onChange: (value: ProductSortId) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const selected = getSortOption(value);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200"
        aria-label="Close sort menu"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="listbox"
        aria-label="Sort products"
        className={cn(
          'absolute inset-x-0 bottom-0 rounded-t-2xl border border-white/[0.08]',
          'bg-dashboard-surface/95 px-4 pb-6 pt-3 shadow-[0_-20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl',
          'animate-in slide-in-from-bottom-4 fade-in duration-200',
        )}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-dashboard-muted">Sort by</p>
            <p className="mt-0.5 text-sm font-semibold text-dashboard-foreground">{selected.label}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-9 items-center justify-center rounded-full border border-white/[0.08] text-dashboard-muted"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-1">
          {PRODUCT_SORT_OPTIONS.map((option) => (
            <SortOptionRow
              key={option.id}
              option={option}
              selected={option.id === value}
              onSelect={() => {
                onChange(option.id);
                onOpenChange(false);
              }}
              className="min-h-12 py-3"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductSortDropdown({ value, onChange, className }: ProductSortDropdownProps) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const selected = getSortOption(value);
  const SelectedIcon = selected.Icon;

  const handleChange = useCallback(
    (next: string) => {
      onChange(next as ProductSortId);
    },
    [onChange],
  );

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={cn(
            'flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-white/[0.08]',
            'bg-dashboard-surface/80 px-4 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-md',
            'transition-all duration-200 hover:border-white/[0.14] focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-bg',
            className,
          )}
          aria-haspopup="listbox"
          aria-expanded={sheetOpen}
        >
          <span className="flex flex-col items-start gap-0.5 text-left">
            <span className="text-[11px] font-medium uppercase tracking-wider text-dashboard-muted">Sort by</span>
            <span className="flex items-center gap-2 text-[15px] font-medium text-dashboard-foreground">
              <SelectedIcon className="size-4 text-primary" />
              {selected.label}
            </span>
          </span>
          <ChevronDown className={cn('size-4 text-dashboard-muted transition-transform duration-200', sheetOpen && 'rotate-180')} />
        </button>
        <MobileSortSheet
          value={value}
          onChange={onChange}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      </>
    );
  }

  return (
    <Select.Root value={value} onValueChange={handleChange}>
      <Select.Trigger
        className={cn(
          'group flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-white/[0.08]',
          'bg-dashboard-surface/80 px-4 shadow-[0_8px_24px_rgba(0,0,0,0.22)] backdrop-blur-md',
          'transition-all duration-200 hover:border-white/[0.14]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-bg',
          'data-[state=open]:border-primary/40 data-[state=open]:shadow-[0_0_0_1px_rgba(139,92,246,0.25),0_12px_32px_rgba(0,0,0,0.28)]',
          'md:w-[200px] lg:w-[240px]',
          className,
        )}
        aria-label="Sort products"
      >
        <span className="flex flex-col items-start gap-0.5 text-left">
          <span className="text-[11px] font-medium uppercase tracking-wider text-dashboard-muted">Sort by</span>
          <span className="flex items-center gap-2 text-[15px] font-medium tracking-wide text-dashboard-foreground">
            <SelectedIcon className="size-4 text-primary" aria-hidden="true" />
            <Select.Value placeholder={selected.label} />
          </span>
        </span>
        <Select.Icon>
          <ChevronDown className="size-4 text-dashboard-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={8}
          className={cn(
            'z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl',
            'border border-white/[0.08] bg-dashboard-surface/95 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150',
          )}
        >
          <Select.Viewport className="space-y-0.5">
            {PRODUCT_SORT_OPTIONS.map((option) => {
              const Icon = option.Icon;

              return (
                <Select.Item
                  key={option.id}
                  value={option.id}
                  className={cn(
                    'group relative flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2.5 outline-none',
                    'text-[14px] font-medium tracking-wide text-dashboard-muted transition-all duration-200',
                    'hover:bg-white/[0.06] hover:text-dashboard-foreground',
                    'focus:bg-white/[0.06] focus:text-dashboard-foreground',
                    'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
                  )}
                >
                  <span
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-data-[state=checked]:opacity-0"
                    aria-hidden="true"
                  />
                  <Select.ItemText>
                    <span className="flex items-center gap-3">
                      <Icon className="size-4 shrink-0" />
                      {option.label}
                    </span>
                  </Select.ItemText>
                  <Select.ItemIndicator className="ml-auto">
                    <Check className="size-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              );
            })}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
