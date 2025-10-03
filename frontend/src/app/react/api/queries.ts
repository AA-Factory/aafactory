// features/staff/model/api/queries.ts

// api/queries.ts
export const getVideoResource = () => ({
  queryKey: ['video-resource'], // Must be an array
  queryFn: async () => {
    const response = await fetch('/api/video');
    if (!response.ok) {
      throw new Error('Failed to fetch video');
    }
    return response.json();
  },
});
