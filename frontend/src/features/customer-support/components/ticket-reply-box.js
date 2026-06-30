'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formCheckboxClass } from '@/components/ui/form-control-styles';
import { cn } from '@/utils/cn';
import { AttachmentUploader } from './attachment-uploader';

export function TicketReplyBox({
  onSubmit,
  isSubmitting,
  placeholder = 'Write your reply...',
  allowInternal = false,
  disabled = false,
  disabledMessage = 'This ticket has been resolved.',
}) {
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);
  const [isInternal, setIsInternal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (disabled) {
    return (
      <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface/60 px-4 py-5 text-center text-sm text-dashboard-muted">
        {disabledMessage}
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmed = body.trim();
    if (!trimmed) {
      setError('Please enter a message before sending.');
      return;
    }

    const formData = new FormData();
    formData.append('body', trimmed);

    if (allowInternal && isInternal) {
      formData.append('is_internal', 'true');
    }

    files.forEach((file) => {
      formData.append('attachments', file);
    });

    setError(null);
    setSuccess(false);

    try {
      await onSubmit(formData);
      setBody('');
      setFiles([]);
      setIsInternal(false);
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err?.message || 'Failed to send reply. Please try again.');
    }
  }

  const submitDisabled = isSubmitting || !body.trim();

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-dashboard-border bg-dashboard-surface p-4"
    >
      {error ? (
        <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
          <CheckCircle2 className="size-4" />
          <AlertDescription>Reply sent successfully.</AlertDescription>
        </Alert>
      ) : null}

      <Textarea
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          if (error) setError(null);
        }}
        placeholder={placeholder}
        rows={4}
        disabled={isSubmitting}
        className="min-h-[120px] resize-none"
      />

      <AttachmentUploader files={files} onChange={setFiles} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {allowInternal ? (
          <label className="flex items-center gap-2 text-sm text-dashboard-muted">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(event) => setIsInternal(event.target.checked)}
              disabled={isSubmitting}
              className={formCheckboxClass}
            />
            Internal note (customer cannot see)
          </label>
        ) : (
          <span />
        )}

        <Button
          type="submit"
          disabled={submitDisabled}
          className={cn(
            'min-w-[140px] rounded-xl shadow-[0_8px_24px_rgba(139,92,246,0.35)] transition-all',
            success && 'border-emerald-500/40 bg-emerald-600 hover:bg-emerald-600',
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending…
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="size-4" />
              Sent
            </>
          ) : (
            <>
              <Send className="size-4" />
              Send Reply
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
