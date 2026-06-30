'use client';

import { useSupportEvents } from '../hooks/use-support-events';

export function SupportRealtimeProvider({ isAdmin = false }) {
  useSupportEvents({ isAdmin });
  return null;
}
