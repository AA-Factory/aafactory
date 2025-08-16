// hooks/useResources.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/utils/api-client'

export const useResources = () => {
  const fetchResources = async () => {
    const response = await apiClient.get('/api/resources');
    return response.data;
  };

  const { data: resources, isLoading, error } = useQuery(['resources'], fetchResources);

  const addResource = useMutation({
    mutationFn: async (newResource) => {
      const response = await apiClient.post('/api/resources', newResource);
      return response.data;
    },
    onSuccess: () => {
      // Optionally refetch resources or update local state
    }
  });

  return {
    resources,
    isLoading,
    error,
    addResource
  };
};

