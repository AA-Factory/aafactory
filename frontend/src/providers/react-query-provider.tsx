// app/providers.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { QUERY_DEFAULTS } from '@/lib/api/constants';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: QUERY_DEFAULTS.STALE_TIME,
            gcTime: QUERY_DEFAULTS.GC_TIME,
            retry: QUERY_DEFAULTS.RETRY_LIMIT,
            refetchOnWindowFocus: QUERY_DEFAULTS.REFRESH_ON_WINDOW_FOCUS,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
