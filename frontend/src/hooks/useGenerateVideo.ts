import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import {
  prepareVideoData,
  createVideoResponse,
  type GenerateVideoPayload,
  type GenerateVideoResponse
} from "@/services/videoService";
import { startTask, pollTaskStatus } from "@/services/shared/taskService";

type UseGenerateVideoOptions = {
  onSuccess?: (data: GenerateVideoResponse) => void;
  onError?: (error: Error) => void;
  retry?: number;
};

export function useGenerateVideo(options?: UseGenerateVideoOptions) {
  const queryClient = useQueryClient();
  const videoUrlsRef = useRef<Set<string>>(new Set());

  // Cleanup function for video URLs
  const cleanupVideoUrl = useCallback((url: string) => {
    if (videoUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      videoUrlsRef.current.delete(url);
    }
  }, []);

  // Cleanup all video URLs
  const cleanupAllVideoUrls = useCallback(() => {
    videoUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    videoUrlsRef.current.clear();
  }, []);

  const mutation = useMutation({
    mutationFn: async (payload: GenerateVideoPayload): Promise<GenerateVideoResponse> => {
      // Prepare video data
      const { taskRequest } = await prepareVideoData(payload);

      // Start task
      const taskId = await startTask(taskRequest, payload.avatar?.id || '', 'VIDEO', payload.prompt);

      // Poll for result
      const base64Video = await pollTaskStatus(taskId, 'VIDEO');

      // Create response
      const result = createVideoResponse(base64Video, taskId);

      // Track the video URL for cleanup
      videoUrlsRef.current.add(result.videoUrl);

      return result;
    },
    onSuccess: (data) => {
      // Invalidate related queries if needed
      queryClient.invalidateQueries({ queryKey: ['avatar-video'] });
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
    retry: (failureCount, error) => {
      // Don't retry on timeout errors
      if (error.message.includes('timed out')) {
        return false;
      }
      return failureCount < (options?.retry ?? 2);
    },
  });

  return {
    ...mutation,
    cleanupVideoUrl,
    cleanupAllVideoUrls,
    // Helper to check error types
    isTimeoutError: mutation.error?.message.includes('timed out') || false,
    isVideoProcessingError: mutation.error?.message.includes('processing') || false,
  };
}
