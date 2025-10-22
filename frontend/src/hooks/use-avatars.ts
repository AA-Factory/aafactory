// frontend/src/hooks/use-avatars.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/lib/types/avatar';
import { useCallback } from 'react';

/** -----------------
 * Query Keys
 * ----------------- */
const avatarKeys = {
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
  createdAt: new Date(avatar.createdAt).toLocaleDateString(),
  updatedAt: new Date(avatar.updatedAt).toLocaleDateString(),
  description: avatar.description || '',
  category: avatar.category || 'realistic',
  personality: avatar.personality || 'No personality defined',
  backgroundKnowledge:
    avatar.backgroundKnowledge || 'No background knowledge defined',
  hasEncodedData: avatar.hasEncodedData || false,
  fileName: avatar.fileName,
  src: avatar.src,
  trainingAudioPath: avatar.trainingAudioPath,
  trainingAudioFileName: avatar.trainingAudioFileName,
});

const apiRequest = async <T>(
  url: string,
  options?: RequestInit,
  isFormData = false,
): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    ...(isFormData
      ? {}
      : {
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
      }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    try {
      const errorData = JSON.parse(responseText);
      if (errorData.validationErrors) {
        throw new Error(
          'Validation errors: ' + JSON.stringify(errorData.validationErrors),
        );
      }
      throw new Error(
        errorData.error || `Request failed with ${response.status}`,
      );
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
  const data = await apiRequest<{ avatars: any[] }>('/api/avatars/get-all', {
    method: 'GET',
  });
  return data.avatars.map(mapAvatar);
};

const fetchAvatarById = async (id: string): Promise<Avatar> => {
  const data = await apiRequest<{ avatar: any }>(
    `/api/avatars/get-avatar?id=${id}`,
    { method: 'GET' },
  );
  return mapAvatar(data.avatar);
};

const deleteAvatar = async (id: string) =>
  apiRequest(`/api/avatars/delete-avatar`, {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });

const createAvatar = async (avatarData: {
  formData?: any;
  file?: File;
  fileName?: string;
  trainingAudio?: File;
  jsonData?: Omit<Avatar, 'id' | 'createdAt'>;
}): Promise<Avatar> => {
  let data;
  if (avatarData.file || avatarData.trainingAudio) {
    const formData = new FormData();
    Object.entries(avatarData.formData || {}).forEach(([key, value]) =>
      formData.append(key, String(value)),
    );
    if (avatarData.file) {
      formData.append('file', avatarData.file);
      formData.append('fileName', avatarData.fileName ?? '');
    }
    if (avatarData.trainingAudio) {
      // Create a new File object with the correct MIME type to ensure proper detection
      const audioFile = new File(
        [avatarData.trainingAudio],
        avatarData.trainingAudio.name,
        { type: avatarData.trainingAudio.type || 'audio/mpeg' },
      );
      formData.append('trainingAudio', audioFile);
    }

    data = await apiRequest<{ avatar: any }>(
      '/api/avatars/create-avatar',
      { method: 'POST', body: formData },
      true,
    );
  } else {
    data = await apiRequest<{ avatar: any }>('/api/avatars/create-avatar', {
      method: 'POST',
      body: JSON.stringify(avatarData.jsonData),
    });
  }
  return mapAvatar(data.avatar);
};

const updateAvatar = async (
  avatarData: {
    id: string;
    file?: File | Blob;
    fileName?: string;
    trainingAudio?: File;
  } & Partial<Avatar>,
): Promise<Avatar> => {
  const { id, file, fileName, trainingAudio, ...rest } = avatarData;
  let data;

  if (file || trainingAudio) {
    const formData = new FormData();
    formData.append('id', id);
    Object.entries(rest).forEach(([key, value]) =>
      formData.append(key, String(value ?? '')),
    );
    if (file) {
      formData.append('file', file);
      formData.append('fileName', fileName || '');
    }
    if (trainingAudio) {
      // Create a new File object with the correct MIME type to ensure proper detection
      const audioFile = new File([trainingAudio], trainingAudio.name, {
        type: trainingAudio.type || 'audio/mpeg',
      });
      formData.append('trainingAudio', audioFile);
    }

    data = await apiRequest<{ avatar: any }>(
      '/api/avatars/update-avatar',
      { method: 'PUT', body: formData },
      true,
    );
  } else {
    data = await apiRequest<{ avatar: any }>('/api/avatars/update-avatar', {
      method: 'PUT',
      body: JSON.stringify({ id, fileName, ...rest }),
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
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

export const usePrefetchAvatars = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.prefetchQuery({
      queryKey: avatarKeys.lists(),
      queryFn: fetchAvatars,
    });
  };
};

export const useAvatar = (id?: string) =>
  useQuery({
    queryKey: avatarKeys.detail(id!),
    queryFn: async () => fetchAvatarById(id!),
    enabled: !!id,
  });

export const usePrefetchAvatar = () => {
  const queryClient = useQueryClient(); // Gets the client from React context

  return useCallback((avatarId: string) => {
    queryClient.prefetchQuery({
      queryKey: avatarKeys.detail(avatarId),
      queryFn: () => fetchAvatarById(avatarId),
    });
  }, [queryClient]);
};

export const useDeleteAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteAvatar'],
    mutationFn: deleteAvatar,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: avatarKeys.lists() });
      const prev = queryClient.getQueryData<Avatar[]>(avatarKeys.lists());
      queryClient.setQueryData<Avatar[]>(
        avatarKeys.lists(),
        (old) => old?.filter((a) => a.id !== id) ?? [],
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(avatarKeys.lists(), ctx.prev);
    },
    onSettled: async () =>
      queryClient.invalidateQueries({ queryKey: avatarKeys.lists() }),
  });
};

export const useCreateAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['createAvatar'],
    mutationFn: createAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: avatarKeys.lists() });
    },
  });
};

export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['updateAvatar'],
    mutationFn: updateAvatar,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: avatarKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: avatarKeys.lists() });
    },
  });
};

/** -----------------
 * Extra Hooks
 * ----------------- */
export const useActiveAvatar = () => {
  const { data: avatars } = useAvatars();
  const getActiveAvatarId = () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('activeAvatarId')
      : null;
  const setActiveAvatarId = (id: string | null) => {
    if (typeof window !== 'undefined') {
      id
        ? localStorage.setItem('activeAvatarId', id)
        : localStorage.removeItem('activeAvatarId');
    }
  };
  const activeAvatarId = getActiveAvatarId();
  const activeAvatar = avatars?.find((a) => a.id === activeAvatarId) || null;
  return { activeAvatarId, activeAvatar, setActiveAvatarId };
};
