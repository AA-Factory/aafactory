import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import {
  prepareAudioData,
  createAudioResponse,
  type GenerateAudioPayload,
  type GenerateAudioResponse
} from "@/services/audioService";
import { startTask, pollTaskStatus } from "@/services/shared/taskService";

type UseGenerateAudioOptions = {
  onSuccess?: (data: GenerateAudioResponse) => void;
  onError?: (error: Error) => void;
  retry?: number;
};

export function useGenerateAudio(options?: UseGenerateAudioOptions) {
  const queryClient = useQueryClient();
  const audioUrlsRef = useRef<Set<string>>(new Set());

  // Cleanup function for audio URLs
  const cleanupAudioUrl = useCallback((url: string) => {
    if (audioUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      audioUrlsRef.current.delete(url);
    }
  }, []);

  // Cleanup all audio URLs
  const cleanupAllAudioUrls = useCallback(() => {
    audioUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    audioUrlsRef.current.clear();
  }, []);

  const mutation = useMutation({
    mutationFn: async (payload: GenerateAudioPayload): Promise<GenerateAudioResponse> => {
      // Prepare audio data
      const { taskRequest } = await prepareAudioData(payload);

      // Start task
      const taskId = await startTask(taskRequest, payload.avatar?.id || '', 'audio', payload.dialog);

      // Poll for result
      const base64Audio = await pollTaskStatus(taskId, 'audio');

      // Create response
      const result = createAudioResponse(base64Audio, taskId);

      // Track the audio URL for cleanup
      audioUrlsRef.current.add(result.audioUrl);

      return result;
    },
    onSuccess: (data) => {
      // Invalidate related queries if needed
      queryClient.invalidateQueries({ queryKey: ['avatar-audio'] });
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
    retry: (failureCount, error) => {
      // Don't retry on timeout errors or training audio issues
      if (error.message.includes('timed out') || error.message.includes('training audio')) {
        return false;
      }
      return failureCount < (options?.retry ?? 2);
    },
  });

  return {
    ...mutation,
    cleanupAudioUrl,
    cleanupAllAudioUrls,
    // Helper to check error types
    isTimeoutError: mutation.error?.message.includes('timed out') || false,
    isTrainingAudioError: mutation.error?.message.includes('training audio') || false,
  };
}
