import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import {
  generateVideo,
  type GenerateVideoPayload,
  type GenerateVideoResponse
} from "@/services/videoService";

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
      const result = await generateVideo(payload);

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
