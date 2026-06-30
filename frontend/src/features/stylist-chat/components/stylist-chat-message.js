'use client';

import { Bot, Loader2, Sparkles, UserRound } from 'lucide-react';
import { StylistProductCard } from '@/features/stylist-chat/components/stylist-product-card';
import { cn } from '@/utils/cn';

function renderInlineMarkdown(text) {
  const parts = `${text || ''}`.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-dashboard-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function SectionBlock({ title, items, tone = 'default' }) {
  if (!items?.length) return null;

  const toneClass =
    tone === 'colors'
      ? 'border-violet-500/30 bg-violet-500/10 text-violet-200'
      : tone === 'budget'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
        : 'border-dashboard-border bg-dashboard-bg/50 text-dashboard-muted';

  return (
    <div className="mt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dashboard-muted">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={`${title}-${item}`}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200 hover:scale-105',
              toneClass,
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function StylistChatMessage({ message, isPending = false }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary/20 text-primary' : 'bg-dashboard-accent-soft text-primary',
        )}
      >
        {isUser ? (
          <UserRound className="size-4" />
        ) : isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Bot className="size-4" />
        )}
      </div>

      <div
        className={cn(
          'max-w-[85%] rounded-2xl border px-4 py-3 sm:max-w-[75%]',
          isUser
            ? 'border-primary/30 bg-primary/15 text-dashboard-foreground'
            : 'border-dashboard-border bg-dashboard-surface text-dashboard-foreground',
        )}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {renderInlineMarkdown(message.content)}
        </div>

        {!isUser && message.products?.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {message.products.map((product) => (
              <StylistProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}

        {!isUser && message.sections ? (
          <div className="mt-2 space-y-1">
            <SectionBlock
              title="Color suggestions"
              items={message.sections.color_suggestions}
              tone="colors"
            />
            <SectionBlock
              title="Accessories"
              items={message.sections.accessories}
            />
            <SectionBlock
              title="Budget tips"
              items={message.sections.budget_tips}
              tone="budget"
            />
          </div>
        ) : null}

        {!isUser && message.source ? (
          <p className="mt-3 flex items-center gap-1 text-[10px] uppercase tracking-wide text-dashboard-muted">
            <Sparkles className="size-3" />
            {message.source === 'openai' ? 'AI enhanced' : 'Personalized stylist'}
          </p>
        ) : null}
      </div>
    </div>
  );
}
