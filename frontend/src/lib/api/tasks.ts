import { AudioTask, VideoTask } from '@/types/tasks';

export const fetchAudioTasks = async (avatarId: string, status?: string): Promise<AudioTask[]> => {
  try {
    const response = await fetch(`/api/tasks/avatar/${avatarId}/audio`);
    const data = await response.json();
    if (data.tasks) {
      return status ? data.tasks.filter((task: AudioTask) => task.status === status) : data.tasks;
    }
    return [];
  } catch (error) {
    console.error('Error fetching audio tasks:', error);
    return [];
  }
};

export const fetchVideoTasks = async (avatarId: string, status?: string): Promise<VideoTask[]> => {
  try {
    const response = await fetch(`/api/tasks/avatar/${avatarId}/video`);
    const data = await response.json();
    if (data.tasks) {
      return status ? data.tasks.filter((task: VideoTask) => task.status === status) : data.tasks;
    }
    return [];
  } catch (error) {
    console.error('Error fetching video tasks:', error);
    return [];
  }
};

export const pollPendingVideoTasks = async (avatarId: string): Promise<{ updatedCount: number }> => {
  try {
    const response = await fetch(`/api/tasks/avatar/${avatarId}/video/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (data.success) {
      return { updatedCount: data.updatedCount };
    }
    return { updatedCount: 0 };
  } catch (error) {
    console.error('Error polling pending video tasks:', error);
    return { updatedCount: 0 };
  }
};

