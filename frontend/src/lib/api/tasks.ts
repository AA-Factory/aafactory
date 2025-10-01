import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AudioTask, VideoTask } from '@/types/tasks';

/** -----------------
 * Query Keys
 * ----------------- */
export const taskKeys = {
  all: ['tasks'] as const,
  audio: () => [...taskKeys.all, 'audio'] as const,
  video: () => [...taskKeys.all, 'video'] as const,
  audioByAvatar: (avatarId: string, status?: string) =>
    [...taskKeys.audio(), { avatarId, status }] as const,
  videoByAvatar: (avatarId: string, status?: string) =>
    [...taskKeys.video(), { avatarId, status }] as const,
};

/** -----------------
 * API Functions
 * ----------------- */
const fetchAudioTasks = async (
  avatarId: string,
  status?: string,
): Promise<AudioTask[]> => {
  const response = await fetch(`/api/tasks/avatar/${avatarId}/audio`);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio tasks: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.tasks) {
    return status
      ? data.tasks.filter((task: AudioTask) => task.status === status)
      : data.tasks;
  }
  return [];
};

const fetchVideoTasks = async (
  avatarId: string,
  status?: string,
): Promise<VideoTask[]> => {
  const response = await fetch(`/api/tasks/avatar/${avatarId}/video`);
  if (!response.ok) {
    throw new Error(`Failed to fetch video tasks: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.tasks) {
    return status
      ? data.tasks.filter((task: VideoTask) => task.status === status)
      : data.tasks;
  }
  return [];
};

const pollPendingVideoTasks = async (
  avatarId: string,
): Promise<{ updatedCount: number }> => {
  const response = await fetch(`/api/tasks/avatar/${avatarId}/video/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to poll pending video tasks: ${response.statusText}`,
    );
  }
  const data = await response.json();
  if (data.success) {
    return { updatedCount: data.stats.updated };
  }
  return { updatedCount: 0 };
};

const pollPendingAudioTasks = async (
  avatarId: string,
): Promise<{ updatedCount: number }> => {
  const response = await fetch(`/api/tasks/avatar/${avatarId}/audio/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to poll pending audio tasks: ${response.statusText}`,
    );
  }
  const data = await response.json();
  if (data.success) {
    return { updatedCount: data.stats.updated };
  }
  return { updatedCount: 0 };
};
/** -----------------
 * React Query Hooks
 * ----------------- */
export const useAudioTasks = (avatarId: string, status?: string) =>
  useQuery({
    queryKey: taskKeys.audioByAvatar(avatarId, status),
    queryFn: async () => fetchAudioTasks(avatarId, status),
    enabled: !!avatarId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

export const useVideoTasks = (avatarId: string, status?: string) =>
  useQuery({
    queryKey: taskKeys.videoByAvatar(avatarId, status),
    queryFn: async () => fetchVideoTasks(avatarId, status),
    enabled: !!avatarId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

export const usePollPendingVideoTasks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['pollPendingVideoTasks'],
    mutationFn: pollPendingVideoTasks,
    onSuccess: (data, avatarId) => {
      if (data.updatedCount > 0) {
        // Invalidate all video task queries for this avatar
        queryClient.invalidateQueries({
          queryKey: taskKeys.videoByAvatar(avatarId),
        });
      }
    },
  });
};

export const usePollPendingAudioTasks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['pollPendingAudioTasks'],
    mutationFn: pollPendingAudioTasks,
    onSuccess: (data, avatarId) => {
      if (data.updatedCount > 0) {
        // Invalidate all audio task queries for this avatar
        queryClient.invalidateQueries({
          queryKey: taskKeys.audioByAvatar(avatarId),
        });
      }
    },
  });
};

/** -----------------
 * Utility Hooks
 * ----------------- */
export const useRefreshTasks = () => {
  const queryClient = useQueryClient();
  return {
    refreshAllTasks: async () =>
      queryClient.invalidateQueries({ queryKey: taskKeys.all }),
    refreshAudioTasks: async (avatarId: string, status?: string) =>
      queryClient.invalidateQueries({
        queryKey: taskKeys.audioByAvatar(avatarId, status),
      }),
    refreshVideoTasks: async (avatarId: string, status?: string) =>
      queryClient.invalidateQueries({
        queryKey: taskKeys.videoByAvatar(avatarId, status),
      }),
    forceRefreshAudioTasks: async (avatarId: string, status?: string) =>
      queryClient.refetchQueries({
        queryKey: taskKeys.audioByAvatar(avatarId, status),
      }),
    forceRefreshVideoTasks: async (avatarId: string, status?: string) =>
      queryClient.refetchQueries({
        queryKey: taskKeys.videoByAvatar(avatarId, status),
      }),
  };
};
