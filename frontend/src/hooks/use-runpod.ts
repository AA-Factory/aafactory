import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RunpodTemplate, RunpodPod, DeployPodParams } from './use-runpod.types';

export type { RunpodTemplate, RunpodPod, DeployPodParams };

export const runpodKeys = {
  all: ['runpod'] as const,
  templates: () => [...runpodKeys.all, 'templates'] as const,
  pods: () => [...runpodKeys.all, 'pods'] as const,
};

export function useRunpodTemplates(enabled: boolean = true) {
  return useQuery({
    queryKey: runpodKeys.templates(),
    queryFn: async () => {
      const response = await fetch('/api/runpod/templates');

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      return response.json() as Promise<RunpodTemplate[]>;
    },
    enabled,
  });
}

export function useRunpodPods(enabled: boolean = true) {
  return useQuery({
    queryKey: runpodKeys.pods(),
    queryFn: async () => {
      const response = await fetch('/api/runpod/pods');

      if (!response.ok) {
        throw new Error('Failed to fetch pods');
      }

      return response.json() as Promise<RunpodPod[]>;
    },
    enabled,
  });
}

export function useDeployPod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DeployPodParams) => {
      const response = await fetch('/api/runpod/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deploy pod');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate pods query to refetch
      queryClient.invalidateQueries({
        queryKey: runpodKeys.pods()
      });
    },
  });
}

export function useDeletePod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (podId: string) => {
      const response = await fetch(
        `/api/runpod/pods/${podId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete pod');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate pods query to refetch
      queryClient.invalidateQueries({
        queryKey: runpodKeys.pods()
      });
    },
  });
}
