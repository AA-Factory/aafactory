export type ResourceType = 'image' | 'video' | 'audio' | 'document';

export interface ResourceData {
  id: string;
  src: string;
  filename: string;
  url: string;
}