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

const createAvatar = async (avatarData: {
  formData?: any;
  file?: File;
  fileName?: string;
  jsonData?: Omit<Avatar, 'id' | 'createdAt'>;
}): Promise<Avatar> => {
  let response;

  if (avatarData.file) {
    // Use FormData for file upload
    const formData = new FormData();
    formData.append('name', avatarData.formData.name);
    formData.append('personality', avatarData.formData.personality);
    formData.append('backgroundKnowledge', avatarData.formData.backgroundKnowledge);
    formData.append('voiceModel', avatarData.formData.voiceModel);
    formData.append('hasEncodedData', avatarData.formData.hasEncodedData?.toString() || 'false');
    formData.append('file', avatarData.file);
    formData.append('fileName', avatarData.fileName ?? '');

    response = await fetch('/api/avatars/create-avatar', {
      method: 'POST',
      body: formData,
    });
  } else {
    // Use JSON for data-only
    response = await fetch('/api/avatars/create-avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(avatarData.jsonData),
    });
  }

  if (!response.ok) {
    const errorData = await response.json();
    if (errorData.validationErrors) {
      throw new Error('Validation errors: ' + JSON.stringify(errorData.validationErrors));
    }
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
    onMutate: async (newAvatarData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: avatarKeys.lists() });

      // Snapshot the previous value
      const previousAvatars = queryClient.getQueryData<Avatar[]>(avatarKeys.lists());

      // Create optimistic avatar data
      const avatarName = newAvatarData.jsonData?.name || newAvatarData.formData?.name || 'New Avatar';
      const tempId = `temp-${Date.now()}`;

      const optimisticAvatar: Avatar = {
        id: tempId,
        name: avatarName,
        imageUrl: '/placeholder-avatar.png',
        voiceModel: newAvatarData.jsonData?.voiceModel || newAvatarData.formData?.voiceModel || 'elevenlabs',
        personality: newAvatarData.jsonData?.personality || newAvatarData.formData?.personality || '',
        backgroundKnowledge: newAvatarData.jsonData?.backgroundKnowledge || newAvatarData.formData?.backgroundKnowledge || '',
        hasEncodedData: newAvatarData.jsonData?.hasEncodedData || newAvatarData.formData?.hasEncodedData || false,
        fileName: newAvatarData.fileName,
        createdAt: new Date().toLocaleDateString(),
      };

      // Optimistically update the cache
      queryClient.setQueryData<Avatar[]>(avatarKeys.lists(), (old) => [
        optimisticAvatar,
        ...(old ?? [])
      ]);

      return { previousAvatars, tempId };
    },
    onSuccess: (newAvatar, variables, context) => {
      // Replace the optimistic avatar with the real one
      queryClient.setQueryData<Avatar[]>(avatarKeys.lists(), (old) => {
        if (!old) return [newAvatar];

        return old.map(avatar =>
          avatar.id === context?.tempId ? newAvatar : avatar
        );
      });

      // Also cache the individual avatar
      queryClient.setQueryData(avatarKeys.detail(newAvatar.id), newAvatar);
    },
    onError: (err, newAvatarData, context) => {
      // Revert to previous state on error
      if (context?.previousAvatars) {
        queryClient.setQueryData(avatarKeys.lists(), context.previousAvatars);
      }
    },
    onSettled: () => {
      // Ensure fresh data
      queryClient.invalidateQueries({ queryKey: avatarKeys.lists() });
    },
  });
};

// Additional API Functions
const fetchAvatarById = async (id: string): Promise<Avatar> => {
  const response = await fetch(`/api/avatars/get-avatar?id=${id}`, {
    method: 'GET'
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch avatar');
  }

  const data = await response.json();
  const avatar = data.avatar;

  return {
    id: avatar._id,
    name: avatar.name || 'Unnamed Avatar',
    imageUrl: avatar.src || '/placeholder-avatar.png',
    voiceModel: avatar.voiceModel || 'elevenlabs',
    createdAt: new Date(avatar.createdAt).toLocaleDateString(),
    personality: avatar.personality || 'No personality defined',
    backgroundKnowledge: avatar.backgroundKnowledge || 'No background knowledge defined',
    hasEncodedData: avatar.hasEncodedData || false,
    fileName: avatar.fileName
  };
};

const updateAvatar = async (avatarData: {
  id: string;
  file?: File | Blob;
  fileName?: string;
} & Partial<Avatar>): Promise<Avatar> => {
  const { id, file, fileName, ...restData } = avatarData;
  let response;

  if (file) {
    // Use FormData for file upload
    const formData = new FormData();
    formData.append('id', id);
    formData.append('name', restData.name || '');
    formData.append('personality', restData.personality || '');
    formData.append('backgroundKnowledge', restData.backgroundKnowledge || '');
    formData.append('voiceModel', restData.voiceModel || 'elevenlabs');
    formData.append('hasEncodedData', restData.hasEncodedData?.toString() || 'false');
    formData.append('file', file);
    formData.append('fileName', fileName || '');

    response = await fetch('/api/avatars/update-avatar', {
      method: 'PUT',
      body: formData,
    });
  } else {
    const jsonPayload = { id, ...restData };

    response = await fetch('/api/avatars/update-avatar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jsonPayload),
    });
  }


  // Get the raw response text first
  const responseText = await response.text();

  if (!response.ok) {
    console.error('❌ Response not ok, status:', response.status);

    try {
      const errorData = JSON.parse(responseText);
      if (errorData.validationErrors) {
        throw new Error('Validation errors: ' + JSON.stringify(errorData.validationErrors));
      }
      throw new Error(errorData.error || 'Failed to update avatar');
    } catch (parseError) {
      console.error('❌ Failed to parse error response as JSON:', parseError);
      throw new Error(`Server error (${response.status}): ${responseText}`);
    }
  }

  try {
    const data = JSON.parse(responseText);

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
  } catch (parseError) {
    console.error('❌ Failed to parse success response as JSON:', parseError);
    console.error('Raw response that failed to parse:', responseText);
    throw new Error(`Invalid JSON response: ${responseText}`);
  }
};
// Additional Custom Hooks
export const useAvatar = (id: string | undefined) => {
  return useQuery({
    queryKey: avatarKeys.detail(id!),
    queryFn: () => fetchAvatarById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAvatar,
    onMutate: async (updatedAvatar) => {
      await queryClient.cancelQueries({ queryKey: avatarKeys.detail(updatedAvatar.id) });
      await queryClient.cancelQueries({ queryKey: avatarKeys.lists() });

      const previousAvatar = queryClient.getQueryData<Avatar>(avatarKeys.detail(updatedAvatar.id));
      const previousAvatars = queryClient.getQueryData<Avatar[]>(avatarKeys.lists());

      // Optimistically update individual avatar
      queryClient.setQueryData<Avatar>(avatarKeys.detail(updatedAvatar.id), (old) =>
        old ? { ...old, ...updatedAvatar } : undefined
      );

      // Optimistically update avatars list
      queryClient.setQueryData<Avatar[]>(avatarKeys.lists(), (old) =>
        old?.map(avatar =>
          avatar.id === updatedAvatar.id ? { ...avatar, ...updatedAvatar } : avatar
        ) ?? []
      );

      return { previousAvatar, previousAvatars };
    },
    onSuccess: (updatedAvatar) => {
      queryClient.setQueryData(avatarKeys.detail(updatedAvatar.id), updatedAvatar);

      // Update in the list as well
      queryClient.setQueryData<Avatar[]>(avatarKeys.lists(), (old) =>
        old?.map(avatar =>
          avatar.id === updatedAvatar.id ? updatedAvatar : avatar
        ) ?? []
      );
    },
    onError: (err, updatedAvatar, context) => {
      if (context?.previousAvatar) {
        queryClient.setQueryData(avatarKeys.detail(updatedAvatar.id), context.previousAvatar);
      }
      if (context?.previousAvatars) {
        queryClient.setQueryData(avatarKeys.lists(), context.previousAvatars);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: avatarKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: avatarKeys.lists() });
    },
  });
};



// Helper hook to refresh all avatar data
export const useRefreshAvatars = () => {
  const queryClient = useQueryClient();

  return {
    refreshAll: () => {
      queryClient.invalidateQueries({ queryKey: avatarKeys.all });
    },
    refreshList: () => {
      queryClient.invalidateQueries({ queryKey: avatarKeys.lists() });
    },
    refreshAvatar: (id: string) => {
      queryClient.invalidateQueries({ queryKey: avatarKeys.detail(id) });
    },
    // Force refetch (bypasses cache)
    forceRefreshList: () => {
      queryClient.refetchQueries({ queryKey: avatarKeys.lists() });
    }
  };
};

// Hook to get real-time avatar count and stats
export const useAvatarStats = () => {
  const { data: avatars = [] } = useAvatars();

  return {
    totalCount: avatars.length,
    encodedCount: avatars.filter(avatar => avatar.hasEncodedData).length,
    regularCount: avatars.filter(avatar => !avatar.hasEncodedData).length,
    recentlyCreated: avatars
      .filter(avatar => {
        const created = new Date(avatar.createdAt);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return created > yesterday;
      })
      .length
  };
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