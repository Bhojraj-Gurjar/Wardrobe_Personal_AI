'use client';

import { useCallback, useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export function FileUpload({
  files = [],
  onChange,
  accept,
  maxSizeMb = 10,
  supportedTypesLabel = 'PNG, JPG, WEBP, PDF, TXT',
  className,
  multiple = true,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback(
    (selected) => {
      if (!selected.length) return;
      onChange?.([...(files || []), ...selected]);
    },
    [files, onChange],
  );

  function handleSelect(event) {
    addFiles(Array.from(event.target.files || []));
    event.target.value = '';
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files || []));
  }

  function removeFile(index) {
    onChange?.(files.filter((_, fileIndex) => fileIndex !== index));
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        aria-label="Upload files"
        className={cn(
          'group relative cursor-pointer rounded-xl border border-dashed p-6 text-center transition-all duration-300 ease-out',
          'border-dashboard-border bg-dashboard-surface/60',
          'hover:border-primary/40 hover:bg-dashboard-surface-elevated/80 hover:shadow-[0_0_24px_rgba(139,92,246,0.12)]',
          isDragging && 'scale-[1.01] border-primary/60 bg-primary/5 shadow-[0_0_32px_rgba(139,92,246,0.2)]',
        )}
      >
        <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl border border-white/[0.08] bg-dashboard-surface-elevated transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-[0_0_16px_rgba(139,92,246,0.15)]">
          <Upload className="size-5 text-purple-light transition-colors duration-300 group-hover:text-white" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold tracking-wide text-dashboard-foreground transition-colors duration-300 group-hover:text-white">
          Drop files here or click to browse
        </p>
        <p className="mt-1 text-xs text-dashboard-muted">
          {supportedTypesLabel} up to {maxSizeMb}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={handleSelect}
        />
      </div>

      {files?.length ? (
        <div className="grid gap-2 sm:grid-cols-2" aria-live="polite">
          {files.map((file, index) => {
            const isImage = file.type?.startsWith('image/');
            const isPdf = file.type === 'application/pdf';
            const isText = file.type === 'text/plain';

            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-xl border border-dashboard-border bg-dashboard-surface px-3 py-2.5 shadow-sm transition-all duration-300 hover:border-primary/30"
              >
                {isImage ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="size-10 rounded-lg object-cover ring-1 ring-white/[0.08]"
                  />
                ) : (
                  <div className="flex size-10 flex-col items-center justify-center rounded-lg bg-dashboard-accent-soft">
                    <FileText className="size-4 text-primary" aria-hidden="true" />
                    {(isPdf || isText) ? (
                      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                        {isPdf ? 'PDF' : 'TXT'}
                      </span>
                    ) : null}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-dashboard-foreground">{file.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full w-full rounded-full bg-primary/70 transition-all duration-500" />
                    </div>
                    <p className="shrink-0 text-xs text-dashboard-muted">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-1 text-dashboard-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeFile(index);
                  }}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
