// Configuration for each resource type
export const RESOURCE_CONFIG = {
  video: {
    allowedTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime'],
    maxSize: 100 * 1024 * 1024, // 100MB
    uploadDir: 'uploads/videos',
    collection: 'videos',
    displayName: 'Videos',
    acceptString: 'video/mp4,video/x-m4v,video/*'
  },
  audio: {
    allowedTypes: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'],
    maxSize: 50 * 1024 * 1024, // 50MB
    uploadDir: 'uploads/audios',
    collection: 'audios',
    displayName: 'Audio',
    acceptString: 'audio/mp3,audio/*'
  },
  image: {
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    uploadDir: 'uploads/images',
    collection: 'images',
    displayName: 'Images',
    acceptString: 'image/*'
  }
} as const;

export type ResourceType = keyof typeof RESOURCE_CONFIG;