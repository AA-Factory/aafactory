import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  prepareAudioData,
  createAudioResponse,
  type GenerateAudioPayload,
} from "@/services/audioService";
import { CELERY_RUN_TASK, CELERY_TASK_STATUS, POLLING_CONFIG } from "@/lib/celery/constants";

export function useGenerateAudio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['generateAudio'],
    mutationFn: async (payload: GenerateAudioPayload) => {
      // 1. Prepare audio data
      const { taskRequest } = await prepareAudioData(payload);

      // 2. Call CELERY_RUN_TASK
      const response = await fetch(CELERY_RUN_TASK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskRequest)
      });

      if (!response.ok) throw new Error('Failed to start task');
      const { task_id } = await response.json();

      // 3. Create task in DB via /api/task
      await fetch('/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task_id,
          avatarId: payload.avatar?.id || '',
          taskType: 'audio',
          userPrompt: payload.dialog,
          status: 'PENDING'
        })
      });

      // 4. Poll for completion
      const pollStatus = async (): Promise<any> => {
        const data = await queryClient.fetchQuery({
          queryKey: ['audioTaskStatus', task_id],
          queryFn: async () => {
            const response = await fetch(`${CELERY_TASK_STATUS}${task_id}`);
            if (!response.ok) throw new Error('Failed to fetch task status');
            return response.json();
          },
        });

        if (data.status === 'SUCCESS' && data.result) {
          // Update DB on completion
          await fetch(`/api/task/${task_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Data: data.result,
              status: 'SUCCESS'
            })
          });
          return createAudioResponse(data.result, task_id);
        } else if (data.status === 'FAILURE') {
          await fetch(`/api/task/${task_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'FAILURE',
              error: data.error || 'No result returned from task'
            })
          });
          throw new Error(data.error || 'Audio generation failed');
        }

        // Still pending, wait and try again
        await new Promise(resolve =>
          setTimeout(resolve, POLLING_CONFIG['audio'].REFETCH_INTERVAL)
        );
        return pollStatus();
      };

      return await pollStatus();
    },
  });
}