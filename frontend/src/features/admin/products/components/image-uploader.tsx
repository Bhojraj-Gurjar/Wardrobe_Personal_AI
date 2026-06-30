'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GripVertical, Star, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { compressImageFile, isAllowedImageType } from '../utils/compress-image';

export type UploadedImageItem = {
  id: string;
  file?: File;
  preview: string;
  url?: string;
  isPrimary: boolean;
  sortOrder: number;
};

type ImageUploaderProps = {
  value: UploadedImageItem[];
  onChange: (images: UploadedImageItem[]) => void;
  error?: string;
};

function createId() {
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function revokeObjectPreview(preview?: string) {
  if (preview?.startsWith('blob:')) {
    URL.revokeObjectURL(preview);
  }
}

export function ImageUploader({ value, onChange, error }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const previewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    previewUrlsRef.current = value
      .map((item) => item.preview)
      .filter((preview): preview is string => Boolean(preview?.startsWith('blob:')));
  }, [value]);

  useEffect(() => () => {
    previewUrlsRef.current.forEach((preview) => revokeObjectPreview(preview));
  }, []);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setUploadError(null);
    const list = Array.from(files);
    const next = [...value];

    for (const file of list) {
      if (!isAllowedImageType(file)) {
        setUploadError('Only JPG, PNG, JPEG, and WebP images are supported.');
        continue;
      }

      try {
        const compressed = await compressImageFile(file);
        const preview = URL.createObjectURL(compressed);
        next.push({
          id: createId(),
          file: compressed,
          preview,
          isPrimary: next.length === 0,
          sortOrder: next.length,
        });
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Failed to process image');
      }
    }

    onChange(next.map((item, index) => ({ ...item, sortOrder: index })));
  }, [onChange, value]);

  const removeImage = (id: string) => {
    const removed = value.find((item) => item.id === id);
    revokeObjectPreview(removed?.preview);

    const filtered = value.filter((item) => item.id !== id);
    const normalized = filtered.map((item, index) => ({
      ...item,
      sortOrder: index,
      isPrimary: index === 0,
    }));
    onChange(normalized);
  };

  const setPrimary = (id: string) => {
    onChange(value.map((item) => ({ ...item, isPrimary: item.id === id })));
  };

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const items = [...value];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    onChange(items.map((item, index) => ({
      ...item,
      sortOrder: index,
      isPrimary: index === 0 ? true : item.isPrimary && index !== 0 ? false : item.isPrimary,
    })).map((item, index) => ({ ...item, isPrimary: index === 0 })));
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (event.dataTransfer.files?.length) {
            processFiles(event.dataTransfer.files);
          }
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition-colors',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-dashboard-border bg-dashboard-bg/50 hover:border-primary/50',
        )}
      >
        <Upload className="mb-3 size-8 text-dashboard-muted" />
        <p className="text-sm font-medium text-dashboard-foreground">Drag & drop images here</p>
        <p className="mt-1 text-xs text-dashboard-muted">JPG, PNG, JPEG, WebP — multiple files supported</p>
        <Button type="button" variant="outline" size="sm" className="mt-4 rounded-lg">
          Browse files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) {
              processFiles(event.target.files);
              event.target.value = '';
            }
          }}
        />
      </div>

      {(error || uploadError) ? (
        <p className="text-xs text-destructive">{error || uploadError}</p>
      ) : null}

      {value.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex != null) reorder(dragIndex, index);
                setDragIndex(null);
              }}
              className="group relative overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.preview || image.url} alt="" className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1.5">
                <button type="button" className="text-dashboard-muted" aria-label="Drag to reorder">
                  <GripVertical className="size-4" />
                </button>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPrimary(image.id)}
                    className={cn('rounded p-1', image.isPrimary ? 'text-amber-400' : 'text-white/70')}
                    aria-label="Set as main image"
                  >
                    <Star className={cn('size-4', image.isPrimary && 'fill-current')} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="rounded p-1 text-white/70 hover:text-destructive"
                    aria-label="Remove image"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              {image.isPrimary ? (
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Main
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
