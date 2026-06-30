'use client';

import { splitHighlightParts } from '../utils/search.utils';

export function SearchHighlight({ text, query, className }) {
  const parts = splitHighlightParts(text, query);

  return (
    <span className={className}>
      {parts.map((part, index) => (
        part.match ? (
          <mark
            key={`${part.text}-${index}`}
            className="rounded bg-primary/25 px-0.5 text-dashboard-foreground"
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        )
      ))}
    </span>
  );
}
