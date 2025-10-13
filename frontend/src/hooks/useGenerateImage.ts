import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  prepareImageData,
  createImageResponse,
  type GenerateImagePayload,
} from '@/services/imageService';
import {
  CELERY_RUN_TASK,
  CELERY_TASK_STATUS,
  POLLING_CONFIG,
} from '@/lib/celery/constants';

export function useGenerateImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['generateImage'],
    mutationFn: async (payload: GenerateImagePayload) => {
      // 1. Prepare image data
      const { taskRequest } = await prepareImageData(payload);

      // 2. Call CELERY_RUN_TASK
      const response = await fetch(CELERY_RUN_TASK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskRequest),
      });

      if (!response.ok) throw new Error('Failed to start task');
      const { task_id } = await response.json();

      // 3. Create task in DB via /api/task
      await fetch('/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task_id,
          avatarId: payload.avatar?.id || null,
          taskType: 'image',
          userPrompt: payload.positivePrompt,
          status: 'PENDING',
        }),
      });
      queryClient.invalidateQueries({
        queryKey: ['tasks', 'image', { avatarId: payload.avatar?.id }],
      });
      // 4. Poll for completion
      const pollStatus = async (): Promise<any> => {
        const data = await queryClient.fetchQuery({
          queryKey: ['imageTaskStatus', task_id],
          queryFn: async () => {
            const response = await fetch(`${CELERY_TASK_STATUS}${task_id}`);
            if (!response.ok) throw new Error('Failed to fetch task status');
            return response.json();
          },
          staleTime: POLLING_CONFIG['image'].STALE_TIME,
        });

        if (data.status === 'SUCCESS' && data.result) {
          // Update DB on completion
          await fetch(`/api/task/${task_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Data: data.result,
              status: 'SUCCESS',
            }),
          });
          queryClient.invalidateQueries({
            queryKey: ['tasks', 'image', { avatarId: payload.avatar?.id }],
          });
          return createImageResponse(data.result, task_id);
        } else if (data.status === 'FAILURE') {
          await fetch(`/api/task/${task_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'FAILURE',
              error: data.error || 'No result returned from task',
            }),
          });
          throw new Error(data.error || 'Image generation failed');
        }

        // Still pending, wait and try again
        await new Promise((resolve) =>
          setTimeout(resolve, POLLING_CONFIG['image'].REFETCH_INTERVAL),
        );
        return pollStatus();
      };

      return await pollStatus();
    },
  });
}
