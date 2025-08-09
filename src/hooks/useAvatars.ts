// hooks/useAvatars.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/types/avatar';

// Query Keys
export const avatarKeys = {
  all: ['avatars'] as const,
  lists: () => [...avatarKeys.all, 'list'] as const,
  list: (filters: string) => [...avatarKeys.lists(), { filters }] as const,
  details: () => [...avatarKeys.all, 'detail'] as const,
  detail: (id: string) => [...avatarKeys.details(), id] as const,
};

// API Functions
const fetchAvatars = async (): Promise<Avatar[]> => {
  const response = await fetch('/api/avatars/get-all', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch avatars');
  }

  const data = await response.json();

  return data.avatars.map((avatar: any) => ({
    id: avatar._id,
    name: avatar.name || 'Unnamed Avatar',
    imageUrl: avatar.src || '/placeholder-avatar.png',
    voiceModel: avatar.voiceModel || 'elevenlabs',
    createdAt: new Date(avatar.createdAt).toLocaleDateString(),
    personality: avatar.personality || 'No personality defined',
    backgroundKnowledge: avatar.backgroundKnowledge || 'No background knowledge defined',
    hasEncodedData: avatar.hasEncodedData || false,
    fileName: avatar.fileName
  }));
};

const deleteAvatar = async (id: string): Promise<void> => {
  const response = await fetch('/api/avatars/delete-avatar', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete avatar');
  }
};

const createAvatar = async (avatarData: Omit<Avatar, 'id' | 'createdAt'>): Promise<Avatar> => {
  const response = await fetch('/api/avatars/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(avatarData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create avatar');
  }

  const data = await response.json();
  return {
    id: data.avatar._id,
    name: data.avatar.name,
    imageUrl: data.avatar.src,
    voiceModel: data.avatar.voiceModel,
    createdAt: new Date(data.avatar.createdAt).toLocaleDateString(),
    personality: data.avatar.personality,
    backgroundKnowledge: data.avatar.backgroundKnowledge,
    hasEncodedData: data.avatar.hasEncodedData,
    fileName: data.avatar.fileName
  };
};

// Custom Hooks
export const useAvatars = () => {
  return useQuery({
    queryKey: avatarKeys.lists(),
    queryFn: fetchAvatars,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useDeleteAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAvatar,
    // Optimistic update
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: avatarKeys.lists() });

      // Snapshot the previous value
      const previousAvatars = queryClient.getQueryData<Avatar[]>(avatarKeys.lists());

      // Optimistically update to the new value
      queryClient.setQueryData<Avatar[]>(avatarKeys.lists(), (old) =>
        old?.filter((avatar) => avatar.id !== deletedId) ?? []
      );

      // Return a context object with the snapshotted value
      return { previousAvatars };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, deletedId, context) => {
      if (context?.previousAvatars) {
        queryClient.setQueryData(avatarKeys.lists(), context.previousAvatars);
      }
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: avatarKeys.lists() });
    },
  });
};

export const useCreateAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAvatar,
    // When mutate is called:
    onMutate: async (newAvatar) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: avatarKeys.lists() });

      // Snapshot the previous value
      const previousAvatars = queryClient.getQueryData<Avatar[]>(avatarKeys.lists());

      // Optimistically update to the new value
      const optimisticAvatar: Avatar = {
        id: `temp-${Date.now()}`, // Temporary ID
        ...newAvatar,
        createdAt: new Date().toLocaleDateString(),
      };

      queryClient.setQueryData<Avatar[]>(avatarKeys.lists(), (old) => [
        ...(old ?? []),
        optimisticAvatar,
      ]);

      return { previousAvatars };
    },
    onError: (err, newAvatar, context) => {
      if (context?.previousAvatars) {
        queryClient.setQueryData(avatarKeys.lists(), context.previousAvatars);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: avatarKeys.lists() });
    },
  });
};

// Hook for managing active avatar (using localStorage + React Query for sync)
export const useActiveAvatar = () => {
  const { data: avatars } = useAvatars();

  const getActiveAvatarId = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeAvatarId');
    }
    return null;
  };

  const setActiveAvatarId = (id: string | null) => {
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('activeAvatarId', id);
      } else {
        localStorage.removeItem('activeAvatarId');
      }
    }
  };

  const activeAvatarId = getActiveAvatarId();
  const activeAvatar = avatars?.find(avatar => avatar.id === activeAvatarId) || null;

  return {
    activeAvatarId,
    activeAvatar,
    setActiveAvatarId,
  };
};