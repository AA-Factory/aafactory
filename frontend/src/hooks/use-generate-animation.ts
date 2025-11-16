// frontend/src/hooks/use-generate-animation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  prepareAnimationData,
  createAnimationResponse,
  type GenerateAnimationPayload,
} from '@/services/animation-service';
import {
  CELERY_RUN_TASK,
  CELERY_TASK_STATUS,
  POLLING_CONFIG,
  TASK_STATUS,
} from '@/lib/celery/constants';
import { type VideoTask, TaskType } from '@/lib/types/tasks';
import { useNotification } from '@/contexts/NotificationContext';
import { apiClient } from '@/lib/api-client';
const TASK_TYPE = 'video' as TaskType;

function invalidateVideoTasks(queryClient: ReturnType<typeof useQueryClient>, avatarId?: string) {
  queryClient.invalidateQueries({
    queryKey: ['tasks', TASK_TYPE, { avatarId }],
  });
}

export function useGenerateAnimation() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  return useMutation({
    mutationKey: ['generateAnimation'],
    mutationFn: async (payload: GenerateAnimationPayload) => {
      const { taskRequest } = await prepareAnimationData(payload);
      const avatarId = payload.avatar?.id || '';
      const { task_id } = await apiClient.post<{ task_id: string }>(CELERY_RUN_TASK, {
        server_name: taskRequest.server_name,
        task_name: taskRequest.task_name,
        payload: taskRequest.payload,
      });

      await apiClient.post<VideoTask>('/api/task', {
        taskId: task_id,
        avatarId: avatarId,
        taskType: TASK_TYPE,
        taskName: payload.taskName,
        status: TASK_STATUS.PENDING,
        metadata: {
          taskInfo: {
            avatarName: payload.avatar?.name,
            startTime: new Date().toISOString(),
            finishTime: null
          },
        },
        imagePrompt: taskRequest.payload.image_bytes,
        videoPrompt: taskRequest.payload.video_bytes,
      });

      invalidateVideoTasks(queryClient, payload.avatar?.id);

      const config = POLLING_CONFIG[TASK_TYPE];
      let taskData: any;

      while (true) {
        taskData = await apiClient.get(`${CELERY_TASK_STATUS}${task_id}`);
        if (taskData.status === TASK_STATUS.SUCCESS && taskData.result) {
          return {
            avatar: payload.avatar,
            ...createAnimationResponse(taskData.result, task_id),
          };
        }
        if (taskData.status === TASK_STATUS.FAILURE) {
          await apiClient.put(`/api/task/${task_id}`, {
            status: TASK_STATUS.FAILURE,
            error: taskData.error || 'No result returned from task',
          });
          throw new Error(taskData.error || 'Animation generation failed');
        }

        await new Promise((res) => setTimeout(res, config.REFETCH_INTERVAL));
      }
    },
    onSuccess: async (data) => {
      await apiClient.put(`/api/task/${data.taskId}`, {
        base64Data: data.base64Video,
        status: 'SUCCESS',
      });
      showNotification(`Animation generation for ${data.avatar?.name} completed`, 'success', 5000, {
        avatarId: data.avatar?.id,
        taskId: data.taskId,
        mediaType: 'video',
      });
      invalidateVideoTasks(queryClient, data.avatar?.id);
    },
    onError: async (error) => {
      showNotification(`Animation generation failed: ${error.message}`, 'error', 5000);
    },
  });
}
