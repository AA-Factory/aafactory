// Configuration for each resource type
export type ResourceType = 'video' | 'audio' | 'image';

export interface ResourceConfig {
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
    uploadDir: 'uploads/videos',
    allowedTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime'],
    maxSize: 100 * 1024 * 1024,
    displayName: 'Video',
    acceptString: 'video/mp4,video/webm'
  },
  audio: {
    collection: 'audios',
    uploadDir: 'uploads/audios',
    allowedTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav'],
    maxSize: 20 * 1024 * 1024,
    displayName: 'Audio',
    acceptString: 'audio/mp3,audio/*'
  },
  image: {
    collection: 'images',
    uploadDir: 'uploads/images',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 10 * 1024 * 1024,
    displayName: 'Image',
    acceptString: 'image/jpeg,image/png,image/webp'
  },
} as const;