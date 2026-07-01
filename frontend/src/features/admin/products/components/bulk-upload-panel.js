'use client';

import { useCallback, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { showToast } from '@/stores/toast-store';
import {
  downloadBulkImportTemplate,
  parseBulkImportFile,
} from '@/features/admin/products/utils/bulk-import.util';

export function BulkUploadPanel({
  onClose,
  onValidate,
  onImport,
  isValidating = false,
  isImporting = false,
}) {
  const inputRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [validation, setValidation] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [importValidOnly, setImportValidOnly] = useState(true);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const validCount = validation?.validCount ?? 0;
  const invalidCount = validation?.invalidCount ?? 0;
  const isBusy = isValidating || isImporting;
  const canImportAll = Boolean(validation?.canImport);
  const canImportPartial = importValidOnly && validCount > 0;
  const canImport = importValidOnly ? canImportPartial : canImportAll;

  const runValidation = useCallback(async (parsedRows) => {
    const result = await onValidate(parsedRows);
    setValidation(result);
    return result;
  }, [onValidate]);

  const handleParsedFile = useCallback(async (file) => {
    setParseError(null);
    setValidation(null);
    setFileName(file.name);

    try {
      const parsedRows = await parseBulkImportFile(file);

      if (!parsedRows.length) {
        setRows([]);
        setParseError('No product rows found. Delete the sample row and add your products, or use the Excel template.');
        return;
      }

      setRows(parsedRows);
      await runValidation(parsedRows);
    } catch (error) {
      setRows([]);
      setParseError(error?.message || 'Unable to parse file. Please upload a valid CSV or Excel template.');
    }
  }, [runValidation]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleParsedFile(file);
    }
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleParsedFile(file);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await downloadBulkImportTemplate();
    } catch (error) {
      showToast(error?.message || 'Unable to download template.', 'error');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleImport = async () => {
    if (!rows.length || !canImport || !validation) {
      return;
    }

    const rowsToImport = importValidOnly
      ? validation.rows.filter((row) => row.isValid).map((row) => row.data)
      : rows;

    try {
      const result = await onImport(rowsToImport);
      const imported = result?.imported ?? rowsToImport.length;
      const skipped = importValidOnly ? invalidCount : 0;

      showToast(
        skipped > 0
          ? `Imported ${imported} product${imported === 1 ? '' : 's'}. Skipped ${skipped} invalid row${skipped === 1 ? '' : 's'}.`
          : `Successfully imported ${imported} product${imported === 1 ? '' : 's'}.`,
        'success',
      );
      onClose();
    } catch (error) {
      showToast(error?.message || 'Bulk import failed. Please review validation errors.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
        aria-label="Close bulk upload"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden',
          'rounded-2xl border border-dashboard-border bg-dashboard-surface shadow-2xl',
        )}
      >
        <div className="flex items-start justify-between border-b border-dashboard-border px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-dashboard-foreground">Bulk Product Upload</h3>
            <p className="mt-1 text-sm text-dashboard-muted">
              Template columns match the Add Single Product form. Review validation before importing.
            </p>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
              className={cn(
                'mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary',
                'transition-colors hover:text-primary/80 hover:underline',
                'cursor-pointer disabled:opacity-60',
              )}
            >
              <Download className="size-4 shrink-0" aria-hidden="true" />
              {isDownloadingTemplate ? 'Preparing template…' : 'Download Excel Template'}
            </button>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-dashboard-border bg-dashboard-bg/30 hover:border-primary/50 hover:bg-dashboard-bg/50',
              isBusy && 'pointer-events-none opacity-60',
            )}
          >
            <Upload className="mb-3 size-8 text-dashboard-muted" aria-hidden="true" />
            <p className="text-sm font-medium text-dashboard-foreground">
              Drop CSV / Excel file here
            </p>
            <p className="mt-1 text-sm text-dashboard-muted">or click to browse</p>
            {fileName ? (
              <p className="mt-3 text-xs text-primary">{fileName}</p>
            ) : null}
          </button>

          {parseError ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          ) : null}

          {validation ? (
            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-dashboard-muted">
                  {validation.totalRows}
                  {' '}
                  row
                  {validation.totalRows === 1 ? '' : 's'}
                  {' '}
                  validated
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  {validation.validCount}
                  {' '}
                  valid
                </span>
                {validation.invalidCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-amber-400">
                    <AlertCircle className="size-4" />
                    {validation.invalidCount}
                    {' '}
                    need fixes
                  </span>
                ) : null}
              </div>

              {invalidCount > 0 ? (
                <label className="flex items-start gap-2 rounded-xl border border-dashboard-border bg-dashboard-bg/30 px-3 py-2.5 text-sm text-dashboard-muted">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={importValidOnly}
                    onChange={(event) => setImportValidOnly(event.target.checked)}
                  />
                  <span>
                    Import valid rows only (skip
                    {' '}
                    {invalidCount}
                    {' '}
                    invalid row
                    {invalidCount === 1 ? '' : 's'}
                    )
                  </span>
                </label>
              ) : null}

              {validation.rows?.some((row) => !row.isValid) ? (
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-dashboard-border bg-dashboard-bg/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-dashboard-muted">
                    Validation report
                  </p>
                  {validation.rows
                    .filter((row) => !row.isValid)
                    .map((row) => (
                      <div key={row.rowNumber} className="text-xs text-dashboard-muted">
                        <span className="font-medium text-amber-400">
                          Row
                          {' '}
                          {row.rowNumber}
                          :
                        </span>
                        {' '}
                        {row.errors.join(' · ')}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  All rows passed validation. Ready to import.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-dashboard-border px-6 py-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!canImport || isBusy}
          >
            {isImporting
              ? 'Importing...'
              : importValidOnly && invalidCount > 0
                ? `Import ${validCount} valid product${validCount === 1 ? '' : 's'}`
                : `Import ${validCount} product${validCount === 1 ? '' : 's'}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
