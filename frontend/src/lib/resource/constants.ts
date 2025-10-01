// Configuration for each resource type
export type ResourceType = 'video' | 'audio' | 'image';

interface ResourceConfig {
  collection: string;
  uploadDir: string;
  allowedTypes: string[];
  maxSize: number;
  displayName: string;
  acceptString: string;
}

export const RESOURCE_CONFIG: Record<ResourceType, ResourceConfig> = {
  video: {
    collection: 'videos',
    uploadDir: 'video',
    allowedTypes: [
      'video/mp4',
      'video/mov',
      'video/avi',
      'video/webm',
      'video/quicktime',
    ],
    maxSize: 100 * 1024 * 1024,
    displayName: 'Video',
    acceptString: 'video/mp4,video/webm',
  },
  audio: {
    collection: 'audios',
    uploadDir: 'audio',
    allowedTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav'],
    maxSize: 20 * 1024 * 1024,
    displayName: 'Audio',
    acceptString: 'audio/mp3,audio/*',
  },
  image: {
    collection: 'images',
    uploadDir: 'image',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 10 * 1024 * 1024,
    displayName: 'Image',
    acceptString: 'image/jpeg,image/png,image/webp',
  },
} as const;

export const RESOURCE_ENDPOINTS = {
  video: '/api/resources/video',
  audio: '/api/resources/audio',
  image: '/api/resources/image',
} as const;

export const RESOURCE_DIRECTORIES = ['video', 'audio', 'image']