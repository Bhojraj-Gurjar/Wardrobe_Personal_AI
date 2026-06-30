'use client';

import { useEffect, useState } from 'react';
import { StylistChatMessage } from './stylist-chat-message';

const DEFAULT_STEPS = [
  'Analyzing your message…',
  'Gathering your style profile…',
  'Preparing recommendations…',
];

export function StylistThinkingMessage({ steps = DEFAULT_STEPS }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (steps.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setStepIndex((current) => (current + 1) % steps.length);
    }, 1400);

    return () => clearInterval(timer);
  }, [steps]);

  const label = steps[stepIndex] || steps[0] || DEFAULT_STEPS[0];

  return (
    <StylistChatMessage
      isPending
      message={{
        role: 'assistant',
        content: label,
        thinking: true,
      }}
    />
  );
}

export function StylistSuggestedQuestions({ questions = [], onSelect, disabled = false }) {
  if (!questions.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {questions.slice(0, 4).map((question) => (
        <button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(question)}
          className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/15 disabled:opacity-50"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
