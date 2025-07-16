// hooks/useVideo.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/utils/api-client'

export function useVideo(videoUrl: string) {
  return useQuery({
    queryKey: ['video', videoUrl],
    queryFn: async () => {
      const response = await apiClient.get<{ data: JSON }>(`/video?url=${encodeURIComponent(videoUrl)}`)
      return response.data
    },
    enabled: !!videoUrl, // Only run the query if videoUrl is provided
  })
}