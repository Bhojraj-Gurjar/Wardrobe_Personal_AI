'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Plus, Send, Sparkles, Trash2 } from 'lucide-react';
import { StylistChatMessage } from '@/features/stylist-chat/components/stylist-chat-message';
import {
  StylistSuggestedQuestions,
  StylistThinkingMessage,
} from '@/features/stylist-chat/components/stylist-thinking-message';
import {
  useDeleteStylistSessionMutation,
  useStylistChatMutation,
  useStylistSessionQuery,
  useStylistSessionsQuery,
  useStylistSuggestionsQuery,
} from '@/features/stylist-chat/hooks';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

export function StylistChatView() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinkingSteps, setThinkingSteps] = useState([]);
  const scrollRef = useRef(null);

  const suggestionsQuery = useStylistSuggestionsQuery();
  const sessionsQuery = useStylistSessionsQuery();
  const sessionQuery = useStylistSessionQuery(sessionId);
  const chatMutation = useStylistChatMutation();
  const deleteSession = useDeleteStylistSessionMutation();

  const examples = suggestionsQuery.data?.examples || [];
  const capabilities = suggestionsQuery.data?.capabilities || [];
  const sessions = sessionsQuery.data || [];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  useEffect(() => {
    if (sessionQuery.data?.messages) {
      setMessages(sessionQuery.data.messages);
    }
  }, [sessionQuery.data?.messages]);

  function handleNewChat() {
    setSessionId(null);
    setMessages([]);
    setInput('');
  }

  function handleSelectSession(id) {
    setSessionId(id);
    setMessages([]);
    setInput('');
  }

  function handleSend(messageText = input) {
    const trimmed = messageText.trim();
    if (!trimmed || chatMutation.isPending) return;

    const optimisticUser = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((current) => [...current, optimisticUser]);
    setInput('');
    setThinkingSteps([
      'Analyzing your message…',
      'Gathering your style profile…',
      'Checking Fashion DNA…',
      'Preparing your response…',
    ]);

    chatMutation.mutate(
      { message: trimmed, session_id: sessionId || undefined },
      {
        onSuccess: (data) => {
          setSessionId(data.session.id);
          setMessages(data.session.messages || []);
          setThinkingSteps([]);
        },
        onError: () => {
          setMessages((current) => current.filter((msg) => msg.id !== optimisticUser.id));
          setInput(trimmed);
          setThinkingSteps([]);
        },
      },
    );
  }

  function handleDeleteSession(id, event) {
    event.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;

    deleteSession.mutate(id, {
      onSuccess: () => {
        if (sessionId === id) {
          handleNewChat();
        }
      },
    });
  }

  if (suggestionsQuery.isLoading) {
    return <LoadingState title="Loading AI Stylist…" rows={3} />;
  }

  if (suggestionsQuery.isError) {
    return (
      <ErrorState
        title="Could not load stylist"
        onRetry={suggestionsQuery.refetch}
      />
    );
  }

  const showWelcome =
    !messages.length && !chatMutation.isPending && !sessionQuery.isLoading;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl flex-col gap-4 pb-4 lg:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col rounded-2xl border border-dashboard-border bg-dashboard-surface lg:flex">
        <div className="flex items-center justify-between border-b border-dashboard-border p-4">
          <p className="text-sm font-semibold text-dashboard-foreground">Chats</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-dashboard-muted hover:text-primary"
            onClick={handleNewChat}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                'interactive-surface group mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200',
                sessionId === session.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-dashboard-muted hover:bg-dashboard-surface-elevated hover:text-dashboard-foreground',
              )}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => handleSelectSession(session.id)}
              >
                <MessageCircle className="size-4 shrink-0" />
                <span className="truncate">{session.title}</span>
              </button>
              <button
                type="button"
                className="opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(event) => handleDeleteSession(session.id, event)}
                aria-label="Delete chat"
              >
                <Trash2 className="size-3.5 text-dashboard-muted hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface">
        <div className="border-b border-dashboard-border px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <h1 className="text-lg font-bold text-dashboard-foreground">AI Stylist</h1>
                  <p className="text-xs text-dashboard-muted">
                    Outfit picks · Colors · Accessories · Budget tips
                  </p>
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-dashboard-border lg:hidden"
              onClick={handleNewChat}
            >
              <Plus className="size-4" />
              New
            </Button>
          </div>

          {capabilities.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {capabilities.map((capability) => (
                <span
                  key={capability}
                  className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary"
                >
                  {capability}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {sessionQuery.isLoading && sessionId ? (
            <LoadingState title="Loading conversation…" rows={2} />
          ) : showWelcome ? (
            <div className="mx-auto max-w-2xl space-y-6 py-8 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="size-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-dashboard-foreground">
                  Your personal AI stylist
                </h2>
                <p className="mt-2 text-sm text-dashboard-muted">
                  Ask about outfits, occasions, colors, or budget — personalized using
                  your Fashion DNA, face & body analysis, and shopping history.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {examples.slice(0, 6).map((example) => (
                  <button
                    key={example}
                    type="button"
                    className={cn(
                      'interactive-card rounded-xl border border-dashboard-border bg-dashboard-bg/40 px-4 py-3',
                      'text-left text-sm text-dashboard-foreground transition-all duration-200',
                      'hover:border-primary/30 hover:bg-primary/5',
                    )}
                    onClick={() => handleSend(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((message, index) => (
                <div key={message.id}>
                  <StylistChatMessage message={message} />
                  {!message.thinking
                    && message.role === 'assistant'
                    && message.suggested_questions?.length
                    && index === messages.length - 1
                    && !chatMutation.isPending ? (
                      <StylistSuggestedQuestions
                        questions={message.suggested_questions}
                        onSelect={handleSend}
                        disabled={chatMutation.isPending}
                      />
                    ) : null}
                </div>
              ))}
              {chatMutation.isPending ? (
                <StylistThinkingMessage steps={thinkingSteps} />
              ) : null}
              <div ref={scrollRef} />
            </div>
          )}
        </div>

        <div className="border-t border-dashboard-border p-4 sm:p-5">
          <form
            className="mx-auto flex max-w-3xl gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
          >
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask e.g. What should I wear for an interview?"
              className="h-12 flex-1 rounded-xl border-dashboard-border bg-dashboard-bg"
              disabled={chatMutation.isPending}
            />
            <Button
              type="submit"
              size="icon"
              className="size-12 shrink-0 rounded-xl bg-primary shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.03] hover:bg-primary/90"
              disabled={!input.trim() || chatMutation.isPending}
            >
              {chatMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
          {chatMutation.isError ? (
            <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-destructive">
              Something went wrong. Please try again.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
