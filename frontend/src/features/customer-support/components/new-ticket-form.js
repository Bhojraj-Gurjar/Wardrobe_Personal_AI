'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SelectField } from '@/components/ui/select';
import { formCheckboxClass } from '@/components/ui/form-control-styles';
import { FormField } from '@/components/shared/form-field';
import { ROUTES } from '@/constants/routes';
import { useCreateSupportTicketMutation } from '../hooks/use-support-tickets';
import {
  CONTACT_METHODS,
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
} from '../utils/support.constants';
import { collectDiagnostics } from '../utils/support.utils';
import { AttachmentUploader } from './attachment-uploader';

export function NewTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const createTicket = useCreateSupportTicketMutation();

  const [form, setForm] = useState({
    subject: '',
    category: searchParams.get('category') || 'GENERAL',
    priority: 'MEDIUM',
    description: '',
    contact_method: 'IN_APP',
    callback_number: '',
    order_reference: '',
    product_reference: '',
    ai_feature_related: false,
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  const diagnostics = useMemo(() => collectDiagnostics(), []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (form.description.trim().length < 20) {
      setError('Description must be at least 20 characters.');
      return;
    }

    const formData = new FormData();

    Object.entries({ ...form, ...diagnostics }).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    files.forEach((file) => {
      formData.append('attachments', file);
    });

    try {
      const ticket = await createTicket.mutateAsync(formData);
      router.push(ROUTES.SUPPORT.TICKET(ticket.id));
    } catch (submitError) {
      setError(submitError?.message || 'Failed to create ticket');
    }
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl"
    >
      <GlassCard>
        <GlassCardContent className="p-6 md:p-8">
          <div className="mb-8">
            <p className="text-sm text-dashboard-muted">Create New Ticket</p>
            <h1 className="mt-1 text-2xl font-bold text-dashboard-foreground">Tell us what you need help with</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <FormField id="subject" label="Subject" required>
              <Input
                id="subject"
                value={form.subject}
                onChange={(event) => updateField('subject', event.target.value)}
                placeholder="Brief summary of your issue"
                required
              />
            </FormField>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField id="category" label="Category" required>
                <SelectField
                  id="category"
                  value={form.category}
                  onChange={(event) => updateField('category', event.target.value)}
                >
                  {SUPPORT_CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </SelectField>
              </FormField>

              <FormField id="priority" label="Priority">
                <SelectField
                  id="priority"
                  value={form.priority}
                  onChange={(event) => updateField('priority', event.target.value)}
                >
                  {SUPPORT_PRIORITIES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </SelectField>
              </FormField>
            </div>

            <FormField id="description" label="Description" required hint="Minimum 20 characters">
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                required
                placeholder="Describe your issue in detail..."
              />
            </FormField>

            <AttachmentUploader files={files} onChange={setFiles} />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField id="contact_method" label="Preferred Contact Method">
                <SelectField
                  id="contact_method"
                  value={form.contact_method}
                  onChange={(event) => updateField('contact_method', event.target.value)}
                >
                  {CONTACT_METHODS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </SelectField>
              </FormField>

              <FormField id="callback_number" label="Callback Number">
                <Input
                  id="callback_number"
                  value={form.callback_number}
                  onChange={(event) => updateField('callback_number', event.target.value)}
                  placeholder="+1 555 000 0000"
                />
              </FormField>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField id="order_reference" label="Order Reference (optional)">
                <Input
                  id="order_reference"
                  value={form.order_reference}
                  onChange={(event) => updateField('order_reference', event.target.value)}
                  placeholder="Order number"
                />
              </FormField>

              <FormField id="product_reference" label="Product Reference (optional)">
                <Input
                  id="product_reference"
                  value={form.product_reference}
                  onChange={(event) => updateField('product_reference', event.target.value)}
                  placeholder="Product name or ID"
                />
              </FormField>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashboard-border bg-dashboard-surface/60 px-4 py-3.5 text-sm text-dashboard-muted transition-colors duration-300 hover:border-white/[0.12]">
              <input
                type="checkbox"
                checked={form.ai_feature_related}
                onChange={(event) => updateField('ai_feature_related', event.target.checked)}
                className={formCheckboxClass}
              />
              AI Feature Related?
            </label>

            {error ? (
              <div
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 transition-opacity duration-300"
                role="alert"
              >
                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                {error}
              </div>
            ) : null}

            <PrimaryButton type="submit" disabled={createTicket.isPending} className="sm:w-auto">
              {createTicket.isPending ? 'Submitting...' : 'Submit Ticket'}
            </PrimaryButton>
          </form>
        </GlassCardContent>
      </GlassCard>
    </motion.div>
  );
}

export function TicketCreatedBanner({ ticketNumber }) {
  if (!ticketNumber) return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200">
      <CheckCircle2 className="size-5" />
      <div>
        <p className="font-medium">Ticket Created Successfully</p>
        <p className="text-sm">Your ticket {ticketNumber} has been submitted.</p>
      </div>
    </div>
  );
}
