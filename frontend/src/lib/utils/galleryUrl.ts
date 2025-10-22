import { Avatar } from '@/lib/types/avatar';
import { AudioTask, VideoTask, ImageTask } from '@/lib/types/tasks';

type Task = AudioTask | VideoTask | ImageTask;

interface GalleryUrlParams {
  avatarId?: string;
  mediaType?: 'image' | 'video' | 'audio';
  taskId?: string;
}

/**
 * Generate a URL to the gallery page with optional pre-selected media
 *
 * @example
 * // Basic gallery link
 * createGalleryUrl()
 * // "/gallery"
 *
 * @example
 * // Link to specific avatar's videos
 * createGalleryUrl({ avatarId: '123', mediaType: 'video' })
 * // "/gallery?avatarId=123&mediaType=video"
 *
 * @example
 * // Link to specific media item
 * createGalleryUrl({ avatarId: '123', mediaType: 'video', taskId: '456' })
 * // "/gallery?avatarId=123&mediaType=video&taskId=456"
 */
export function createGalleryUrl(params?: GalleryUrlParams): string {
  if (!params) return '/gallery';

  const searchParams = new URLSearchParams();

  if (params.avatarId) {
    searchParams.set('avatarId', params.avatarId);
  }

  if (params.mediaType) {
    searchParams.set('mediaType', params.mediaType);
  }

  if (params.taskId) {
    searchParams.set('taskId', params.taskId);
  }

  const query = searchParams.toString();
  return query ? `/gallery?${query}` : '/gallery';
}

/**
 * Helper to create a gallery URL from avatar and task objects
 */
export function createGalleryUrlFromTask(
  avatar: Avatar,
  task: Task,
): string {
  return createGalleryUrl({
    avatarId: avatar.id,
    mediaType: task.taskType,
    taskId: task.taskId,
  });
}
