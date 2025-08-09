// hooks/useAvatars.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/types/avatar';

/** -----------------
 * Query Keys
 * ----------------- */
export const avatarKeys = {
  all: ['avatars'] as const,
  lists: () => [...avatarKeys.all, 'list'] as const,
  list: (filters: string) => [...avatarKeys.lists(), { filters }] as const,
  details: () => [...avatarKeys.all, 'detail'] as const,
  detail: (id: string) => [...avatarKeys.details(), id] as const,
};

/** -----------------
 * Helpers
 * ----------------- */
const mapAvatar = (avatar: any): Avatar => ({
  id: avatar._id,
  name: avatar.name || 'Unnamed Avatar',
  imageUrl: avatar.src || '/placeholder-avatar.png',
  voiceModel: avatar.voiceModel || 'elevenlabs',
  createdAt: new Date(avatar.createdAt).toLocaleDateString(),
  personality: avatar.personality || 'No personality defined',
  backgroundKnowledge: avatar.backgroundKnowledge || 'No background knowledge defined',
  hasEncodedData: avatar.hasEncodedData || false,
  fileName: avatar.fileName
});

const apiRequest = async <T>(
  url: string,
  options?: RequestInit,
  isFormData = false
): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) } })
  });

  const responseText = await response.text();

  if (!response.ok) {
    try {
      const errorData = JSON.parse(responseText);
      if (errorData.validationErrors) {
        throw new Error('Validation errors: ' + JSON.stringify(errorData.validationErrors));
      }
      throw new Error(errorData.error || `Request failed with ${response.status}`);
    } catch {
      throw new Error(`Server error (${response.status}): ${responseText}`);
    }
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid JSON response: ${responseText}`);
  }
};

/** -----------------
 * API Functions
 * ----------------- */
const fetchAvatars = async (): Promise<Avatar[]> => {
  const data = await apiRequest<{ avatars: any[] }>('/api/avatars/get-all', { method: 'GET' });
  return data.avatars.map(mapAvatar);
};

const fetchAvatarById = async (id: string): Promise<Avatar> => {
  const data = await apiRequest<{ avatar: any }>(`/api/avatars/get-avatar?id=${id}`, { method: 'GET' });
  return mapAvatar(data.avatar);
};

const deleteAvatar = (id: string) =>
  apiRequest(`/api/avatars/delete-avatar`, {
    method: 'DELETE',
    body: JSON.stringify({ id })
  });

const createAvatar = async (avatarData: {
  formData?: any;
  file?: File;
  fileName?: string;
  jsonData?: Omit<Avatar, 'id' | 'createdAt'>;
}): Promise<Avatar> => {
  let data;
  if (avatarData.file) {
    const formData = new FormData();
    Object.entries(avatarData.formData || {}).forEach(([key, value]) =>
      formData.append(key, String(value))
    );
    formData.append('file', avatarData.file);
    formData.append('fileName', avatarData.fileName ?? '');

    data = await apiRequest<{ avatar: any }>('/api/avatars/create-avatar', { method: 'POST', body: formData }, true);
  } else {
    data = await apiRequest<{ avatar: any }>('/api/avatars/create-avatar', {
      method: 'POST',
      body: JSON.stringify(avatarData.jsonData)
    });
  }
  return mapAvatar(data.avatar);
};

const updateAvatar = async (avatarData: {
  id: string;
  file?: File | Blob;
  fileName?: string;
} & Partial<Avatar>): Promise<Avatar> => {
  const { id, file, fileName, ...rest } = avatarData;
  let data;

  if (file) {
    const formData = new FormData();
    formData.append('id', id);
    Object.entries(rest).forEach(([key, value]) => formData.append(key, String(value ?? '')));
    formData.append('file', file);
    formData.append('fileName', fileName || '');

    data = await apiRequest<{ avatar: any }>('/api/avatars/update-avatar', { method: 'PUT', body: formData }, true);
  } else {
    data = await apiRequest<{ avatar: any }>('/api/avatars/update-avatar', {
      method: 'PUT',
      body: JSON.stringify({ id, ...rest })
    });
  }
  return mapAvatar(data.avatar);
};

/** -----------------
 * Hooks
 * ----------------- */
export const useAvatars = () =>
  useQuery({
    queryKey: avatarKeys.lists(),
    queryFn: fetchAvatars,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

export const useAvatar = (id?: string) =>
  useQuery({
    queryKey: avatarKeys.detail(id || ''),
    queryFn: () => fetchAvatarById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000
  });

export const useDeleteAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAvatar,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: avatarKeys.lists() });
      const prev = queryClient.getQueryData<Avatar[]>(avatarKeys.lists());
      queryClient.setQueryData<Avatar[]>(avatarKeys.lists(), (old) => old?.filter((a) => a.id !== id) ?? []);
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(avatarKeys.lists(), ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: avatarKeys.lists() })
  });
};

export const useCreateAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAvatar,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: avatarKeys.lists() });
      const prev = queryClient.getQueryData<Avatar[]>(avatarKeys.lists());
      const tempId = `temp-${Date.now()}`;
      queryClient.setQueryData<Avatar[]>(avatarKeys.lists(), (old) => [
        {
          id: tempId,
          name: newData.jsonData?.name || newData.formData?.name || 'New Avatar',
          imageUrl: '/placeholder-avatar.png',
          voiceModel: newData.jsonData?.voiceModel || newData.formData?.voiceModel || 'elevenlabs',
          personality: newData.jsonData?.personality || newData.formData?.personality || '',
          backgroundKnowledge: newData.jsonData?.backgroundKnowledge || newData.formData?.backgroundKnowledge || '',
          hasEncodedData: newData.jsonData?.hasEncodedData || newData.formData?.hasEncodedData || false,
          fileName: newData.fileName,
          createdAt: new Date().toLocaleDateString()
        },
        ...(old ?? [])
      ]);
      return { prev, tempId };
    },
    onSuccess: (newAvatar, _, ctx) => {
      queryClient.setQueryData<Avatar[]>(avatarKeys.lists(), (old) =>
        old?.map((a) => (a.id === ctx?.tempId ? newAvatar : a)) ?? []
      );
      queryClient.setQueryData(avatarKeys.detail(newAvatar.id), newAvatar);
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(avatarKeys.lists(), ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: avatarKeys.lists() })
  });
};

export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAvatar,
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: avatarKeys.detail(updated.id) });
      await queryClient.cancelQueries({ queryKey: avatarKeys.lists() });
      const prevAvatar = queryClient.getQueryData<Avatar>(avatarKeys.detail(updated.id));
      const prevList = queryClient.getQueryData<Avatar[]>(avatarKeys.lists());
      queryClient.setQueryData<Avatar>(avatarKeys.detail(updated.id), (old) => old ? { ...old, ...updated } : undefined);
      queryClient.setQueryData<Avatar[]>(avatarKeys.lists(), (old) =>
        old?.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)) ?? []
      );
      return { prevAvatar, prevList };
    },
    onSuccess: (updatedAvatar) => {
      queryClient.setQueryData(avatarKeys.detail(updatedAvatar.id), updatedAvatar);
      queryClient.setQueryData<Avatar[]>(avatarKeys.lists(), (old) =>
        old?.map((a) => (a.id === updatedAvatar.id ? updatedAvatar : a)) ?? []
      );
    },
    onError: (_, vars, ctx) => {
      if (ctx?.prevAvatar) queryClient.setQueryData(avatarKeys.detail(vars.id), ctx.prevAvatar);
      if (ctx?.prevList) queryClient.setQueryData(avatarKeys.lists(), ctx.prevList);
    },
    onSettled: (_, __, vars) => {
      queryClient.invalidateQueries({ queryKey: avatarKeys.detail(vars.id) });
      queryClient.invalidateQueries({ queryKey: avatarKeys.lists() });
    }
  });
};

/** -----------------
 * Extra Hooks
 * ----------------- */
export const useRefreshAvatars = () => {
  const queryClient = useQueryClient();
  return {
    refreshAll: () => queryClient.invalidateQueries({ queryKey: avatarKeys.all }),
    refreshList: () => queryClient.invalidateQueries({ queryKey: avatarKeys.lists() }),
    refreshAvatar: (id: string) => queryClient.invalidateQueries({ queryKey: avatarKeys.detail(id) }),
    forceRefreshList: () => queryClient.refetchQueries({ queryKey: avatarKeys.lists() })
  };
};

export const useActiveAvatar = () => {
  console.log('useActiveAvatar called');
  const { data: avatars } = useAvatars();
  const getActiveAvatarId = () => (typeof window !== 'undefined' ? localStorage.getItem('activeAvatarId') : null);
  const setActiveAvatarId = (id: string | null) => {
    if (typeof window !== 'undefined') {
      id ? localStorage.setItem('activeAvatarId', id) : localStorage.removeItem('activeAvatarId');
    }
  };
  const activeAvatarId = getActiveAvatarId();
  const activeAvatar = avatars?.find((a) => a.id === activeAvatarId) || null;
  return { activeAvatarId, activeAvatar, setActiveAvatarId };
};
