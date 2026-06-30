'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { consumeFaceAuthSuccessMessage } from '@/features/face/utils/face-auth-success';

export function FaceAuthSuccessBanner() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const successMessage = consumeFaceAuthSuccessMessage();
    if (successMessage) {
      setMessage(successMessage);
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200"
    >
      <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
