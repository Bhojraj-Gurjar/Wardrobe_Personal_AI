'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { SessionProvider } from '@/features/auth/components/session-provider';
import { bindAuthSessionQueryClient } from '@/features/auth/utils/clear-auth-session';
import { bindFashionDnaQueryClient } from '@/features/fashion-dna/utils/schedule-fashion-dna-invalidation';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME.DEFAULT,
        gcTime: QUERY_STALE_TIME.LONG * 2,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        retry: 1,
        placeholderData: (previousData) => previousData,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function AppProviders({ children }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    bindAuthSessionQueryClient(queryClient);
    bindFashionDnaQueryClient(queryClient);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}
