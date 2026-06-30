import { Sparkles } from 'lucide-react';
import { APP_NAME } from '@/constants/app';

export function FaceLayoutShell({ children, title, description }) {
  return (
    <div className="min-h-screen bg-auth-panel">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary">
            <Sparkles className="size-5 text-primary-foreground" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-auth-panel-muted">
              {APP_NAME}
            </p>
            {title ? (
              <h1 className="text-lg font-semibold text-auth-panel-foreground">{title}</h1>
            ) : null}
          </div>
        </div>
        {description ? (
          <p className="mb-6 text-sm text-auth-panel-muted">{description}</p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
