import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import {
  generateAudio,
  AudioGenerationError,
  TaskTimeoutError,
  TrainingAudioError,
  type GenerateAudioPayload,
  type GenerateAudioResponse
} from "@/services/audioService";

type UseGenerateAudioOptions = {
  onSuccess?: (data: GenerateAudioResponse) => void;
  onError?: (error: AudioGenerationError) => void;
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
      const result = await generateAudio(payload);

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
      // Convert generic errors to AudioGenerationError if needed
      const audioError = error instanceof AudioGenerationError
        ? error
        : new AudioGenerationError(error.message, 'UNKNOWN_ERROR');

      options?.onError?.(audioError);
    },
    retry: (failureCount, error) => {
      // Don't retry on certain error types
      if (error instanceof TaskTimeoutError || error instanceof TrainingAudioError) {
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
    isTimeoutError: mutation.error instanceof TaskTimeoutError,
    isTrainingAudioError: mutation.error instanceof TrainingAudioError,
    errorCode: mutation.error instanceof AudioGenerationError ? mutation.error.code : undefined,
  };
}