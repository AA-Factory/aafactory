// frontend/src/hooks/use-generate-image.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  prepareImageData,
  createImageResponse,
  type GenerateImagePayload,
} from '@/services/image-service';
import {
  CELERY_RUN_TASK,
  CELERY_TASK_STATUS,
  POLLING_CONFIG,
  TASK_STATUS,
} from '@/lib/celery/constants';
import { type ImageTask, TaskType } from '@/lib/types/tasks';
import { useNotification } from '@/contexts/NotificationContext';
import { apiClient } from '@/lib/api-client';
const TASK_TYPE = 'image' as TaskType;

function invalidateImageTasks(queryClient: ReturnType<typeof useQueryClient>, avatarId?: string) {
  queryClient.invalidateQueries({
    queryKey: ['tasks', TASK_TYPE, { avatarId }],
  });
}

export function useGenerateImage() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationKey: ['generateImage'],
    mutationFn: async (payload: GenerateImagePayload) => {
      const { taskRequest } = await prepareImageData(payload);
      const { task_id } = await apiClient.post<{ task_id: string }>(CELERY_RUN_TASK, {
        server_name: taskRequest.server_name,
        task_name: taskRequest.task_name,
        payload: taskRequest.payload,
      });

      await apiClient.post<ImageTask>('/api/task', {
        taskId: task_id,
        avatarId: payload.avatar?.id || null,
        taskType: TASK_TYPE,
        userPrompt: payload.positivePrompt,
        status: TASK_STATUS.PENDING,
      });
      invalidateImageTasks(queryClient, payload.avatar?.id);

      const config = POLLING_CONFIG[TASK_TYPE];
      let taskData: any;

      while (true) {
        taskData = await apiClient.get(`${CELERY_TASK_STATUS}${task_id}`);
        if (taskData.status === TASK_STATUS.SUCCESS && taskData.result) {
          return {
            avatar: payload.avatar,
            ...createImageResponse(taskData.result, task_id),
          };
        }
        if (taskData.status === TASK_STATUS.FAILURE) {
          await apiClient.put(`/api/task/${task_id}`, {
            status: TASK_STATUS.FAILURE,
            error: taskData.error || 'No result returned from task',
          });
          throw new Error(taskData.error || 'Image generation failed');
        }

        await new Promise((res) => setTimeout(res, config.REFETCH_INTERVAL));
      }
    },
    onSuccess: async (data) => {
      await apiClient.put(`/api/task/${data.taskId}`, {
        base64Data: data.base64Image,
        status: TASK_STATUS.SUCCESS,
      });

      showNotification(
        `Image generation for ${data.avatar?.name ?? 'Avatar'} completed`,
        'success',
        5000,
        {
          avatarId: data.avatar?.id,
          taskId: data.taskId,
          mediaType: TASK_TYPE,
        },
      );

      invalidateImageTasks(queryClient, data.avatar?.id);
    },
    onError: (error: any) => {
      const message = error?.message || 'Unknown error occurred';
      showNotification(`Image generation failed: ${message}`, 'error', 5000);
    },
  });
}
