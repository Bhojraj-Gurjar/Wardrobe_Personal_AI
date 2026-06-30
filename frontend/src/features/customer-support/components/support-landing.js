'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Clock3,
  Headphones,
  MessageSquarePlus,
  Search,
  Ticket,
} from 'lucide-react';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import { useSupportTicketsQuery } from '../hooks/use-support-tickets';
import { QUICK_HELP_CARDS } from '../utils/support.constants';
import { formatSupportDate, getTicketLastMessagePreview } from '../utils/support.utils';
import { StatusBadge } from './status-badge';
import { PriorityBadge } from './priority-badge';
import { SupportSkeleton } from './support-skeleton';

export function SupportLandingView() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useSupportTicketsQuery({ limit: 5, sortBy: 'updated_at' });

  const recentTickets = data?.items || [];

  return (
    <div className="space-y-8">
      <motion.section
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <GlassCard className="overflow-hidden border-white/10 bg-gradient-to-br from-[#111827]/95 via-[#0f172a]/90 to-[#1e1b4b]/80">
          <GlassCardContent className="relative p-8 md:p-10">
            <div className="absolute -right-10 -top-10 size-48 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="relative z-10 max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-purple-200">
                <Headphones className="size-3.5" />
                Customer Support
              </div>
              <div>
                <p className="text-sm text-dashboard-muted">Need Help?</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">
                  How can we help you today?
                </h1>
                <p className="mt-3 max-w-2xl text-dashboard-muted">
                  Get premium support for orders, AI features, account issues, and more.
                  Our team is here to help you get the most out of Wardrobe AI.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dashboard-muted" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search your previous tickets"
                    className="border-white/10 bg-white/5 pl-10"
                  />
                </div>
                <Link
                  href={ROUTES.SUPPORT.NEW}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-700 px-6 text-base font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02]"
                >
                  <MessageSquarePlus className="size-4" />
                  Create New Ticket
                </Link>
                <Link
                  href={`${ROUTES.SUPPORT.TICKETS}${search ? `?search=${encodeURIComponent(search)}` : ''}`}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 px-6 text-base font-semibold text-dashboard-foreground transition-all hover:bg-white/5"
                >
                  <Ticket className="size-4" />
                  View My Tickets
                </Link>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {QUICK_HELP_CARDS.map((card, index) => (
          <motion.div
            key={card.title}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.35 }}
          >
            <Link
              href={`${ROUTES.SUPPORT.NEW}?category=${card.category}`}
              className="interactive-card block h-full rounded-2xl border border-dashboard-border bg-dashboard-surface p-5 transition-all hover:border-purple-500/30"
            >
              <h3 className="font-semibold text-dashboard-foreground">{card.title}</h3>
              <p className="mt-2 text-sm text-dashboard-muted">{card.description}</p>
              <span className="mt-4 inline-flex items-center text-sm text-primary">
                Get help
                <ArrowRight className="ml-1 size-4" />
              </span>
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-dashboard-foreground">Recent Activity</h2>
            <p className="text-sm text-dashboard-muted">Your latest support tickets</p>
          </div>
          <Link href={ROUTES.SUPPORT.TICKETS} className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>

        {isLoading ? (
          <SupportSkeleton />
        ) : recentTickets.length ? (
          <div className="overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-dashboard-border/60 text-xs uppercase tracking-wider text-dashboard-muted">
                <tr>
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    role="link"
                    tabIndex={0}
                    className="cursor-pointer border-b border-dashboard-border/60 last:border-0 hover:bg-dashboard-surface-elevated/40"
                    onClick={() => router.push(ROUTES.SUPPORT.TICKET(ticket.id))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        router.push(ROUTES.SUPPORT.TICKET(ticket.id));
                      }
                    }}
                  >
                    <td className="px-4 py-4">
                      <p className="font-medium text-dashboard-foreground">{ticket.subject}</p>
                      <p className="text-xs text-dashboard-muted">{ticket.ticketNumber}</p>
                      {getTicketLastMessagePreview(ticket) ? (
                        <p className="mt-1 line-clamp-1 text-xs text-dashboard-muted">
                          {getTicketLastMessagePreview(ticket)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={ticket.status} /></td>
                    <td className="px-4 py-4"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="px-4 py-4 text-dashboard-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5" />
                        {formatSupportDate(ticket.updatedAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-dashboard-border bg-dashboard-surface p-10 text-center">
            <Headphones className="mx-auto size-10 text-primary" />
            <p className="mt-4 font-medium text-dashboard-foreground">No tickets yet</p>
            <p className="mt-1 text-sm text-dashboard-muted">Create your first support ticket to get started.</p>
            <Link
              href={ROUTES.SUPPORT.NEW}
              className="mt-5 inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-purple-700 px-6 text-base font-semibold text-white"
            >
              Create New Ticket
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-dashed border-dashboard-border bg-dashboard-surface/60 p-6">
        <h2 className="text-lg font-semibold text-dashboard-foreground">FAQs</h2>
        <p className="mt-2 text-sm text-dashboard-muted">
          Knowledge base and self-service articles are coming soon. For now, our support team is ready to help.
        </p>
      </section>
    </div>
  );
}
