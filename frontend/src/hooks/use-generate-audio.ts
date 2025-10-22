// frontend/src/hooks/use-generate-audio.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  prepareAudioData,
  createAudioResponse,
  type GenerateAudioPayload,
} from '@/services/audio-service';
import {
  CELERY_RUN_TASK,
  CELERY_TASK_STATUS,
  POLLING_CONFIG,
  TASK_STATUS,
} from '@/lib/celery/constants';
import { type AudioTask, TaskType } from '@/lib/types/tasks';
import { useNotification } from '@/contexts/NotificationContext';
import { apiClient } from '@/lib/api-client';
const TASK_TYPE = 'audio' as TaskType;

function invalidateAudioTasks(queryClient: ReturnType<typeof useQueryClient>, avatarId?: string) {
  queryClient.invalidateQueries({
    queryKey: ['tasks', TASK_TYPE, { avatarId }],
  });
}
export function useGenerateAudio() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  return useMutation({
    mutationKey: ['generateAudio'],
    mutationFn: async (payload: GenerateAudioPayload) => {
      const { taskRequest } = await prepareAudioData(payload);
      const avatarId = payload.avatar?.id || '';
      const { task_id } = await apiClient.post<{ task_id: string }>(CELERY_RUN_TASK, {
        server_name: taskRequest.server_name,
        task_name: taskRequest.task_name,
        payload: taskRequest.payload,
      });

      await apiClient.post<AudioTask>('/api/task', {
        taskId: task_id,
        avatarId: avatarId,
        taskType: TASK_TYPE,
        userPrompt: payload.dialog,
        status: TASK_STATUS.PENDING,
      });
      const config = POLLING_CONFIG[TASK_TYPE];
      let taskData: any;

      while (true) {
        taskData = await apiClient.get(`${CELERY_TASK_STATUS}${task_id}`);
        if (taskData.status === TASK_STATUS.SUCCESS && taskData.result) {
          return {
            avatar: payload.avatar,
            ...createAudioResponse(taskData.result, task_id),
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
        base64Data: data.base64Audio,
        status: 'SUCCESS',
      });
      invalidateAudioTasks(queryClient, data.avatar?.id);
      showNotification(`Audio generation for ${data.avatar?.name} completed`, 'success', 5000, {
        avatarId: data.avatar?.id,
        taskId: data.taskId,
        mediaType: 'audio',
      });
    },
    onError: async (error) => {
      showNotification(`Audio generation failed: ${error.message}`, 'error', 5000);
    },
  });
}
