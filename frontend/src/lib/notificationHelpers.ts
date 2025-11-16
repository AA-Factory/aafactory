import { AudioTask, VideoTask, ImageTask } from '@/lib/types/tasks';

type Task = AudioTask | VideoTask | ImageTask;
type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Helper to create notification options for a completed task
 *
 * @example
 * const task = { taskId: '123', taskType: 'video', ... };
 * const avatarId = 'avatar-456';
 *
 * showNotification(
 *   'Video generated successfully!',
 *   'success',
 *   5000,
 *   createTaskNotificationOptions(task, avatarId)
 * );
 */
export function createTaskNotificationOptions(task: Task, avatarId: string) {
  return {
    avatarId,
    taskId: task.taskId,
    mediaType: task.taskType,
  };
}

/**
 * Helper to show a task completion notification
 *
 * @example
 * // In your component:
 * const { showNotification } = useNotification();
 *
 * // When task completes:
 * showTaskNotification(
 *   showNotification,
 *   task,
 *   avatarId,
 *   'Video generated successfully!'
 * );
 */
export function showTaskNotification(
  showNotification: (
    message: string,
    type?: NotificationType,
    duration?: number,
    options?: {
      avatarId?: string;
      taskId?: string;
      mediaType?: 'image' | 'video' | 'audio';
    },
  ) => void,
  task: Task,
  avatarId: string,
  message: string,
  type: NotificationType = 'success',
  duration = 5000,
) {
  showNotification(message, type, duration, {
    avatarId,
    taskId: task.taskId,
    mediaType: task.taskType,
  });
}
