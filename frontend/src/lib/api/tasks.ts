import { AudioTask, VideoTask } from '@/types/tasks';

export const fetchAudioTasks = async (avatarId: string): Promise<AudioTask[]> => {
  try {
    const response = await fetch(`/api/tasks/audio/${avatarId}`);
    const data = await response.json();
    return data.success ? data.audioTasks : [];
  } catch (error) {
    console.error('Error fetching audio tasks:', error);
    return [];
  }
};

export const fetchVideoTasks = async (avatarId: string): Promise<VideoTask[]> => {
  try {
    const response = await fetch(`/api/tasks?avatarId=${avatarId}`);
    const data = await response.json();
    if (data.tasks) {
      return data.tasks.filter((task: VideoTask) => task.taskType === 'VIDEO');
    }
    return [];
  } catch (error) {
    console.error('Error fetching video tasks:', error);
    return [];
  }
};

export const pollPendingVideoTasks = async (): Promise<{ updatedCount: number }> => {
  try {
    const response = await fetch('/api/tasks/polling/check', {
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

