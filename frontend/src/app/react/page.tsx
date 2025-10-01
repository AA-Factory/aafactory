import { dehydrate } from '@tanstack/react-query';
import { HydrationBoundary, QueryClient } from '@tanstack/react-query';
import React from 'react';
import { cache } from 'react';
import { getVideoResource } from './api/queries';
import LoadingState from '@/components/avatars/LoadingState';
export default async function ReactPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(getVideoResource());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* //use the state here */}
      <React.Suspense fallback={<LoadingState />}>
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">React Page</h1>
          <p>
            This is a React page using TanStack Query with server-side data
            fetching.
          </p>
        </div>
      </React.Suspense>
    </HydrationBoundary>
  );
}
