// hooks/useVideo.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/utils/api-client'

export function useVideo(videoUrl: string) {
  return useQuery({
    queryKey: ['video', videoUrl],
    queryFn: async () => {
      const response = await apiClient.get<{ data: any }>(`/video?url=${encodeURIComponent(videoUrl)}`)
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3, // Retry failed requests up to 3 times
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !!videoUrl, // Only run the query if videoUrl is provided
  })
}