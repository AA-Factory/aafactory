import { CeleryTaskRequest, CeleryTaskStatus, ServerName } from './celery';

export type TaskType = 'audio' | 'video' | 'image';
export interface AudioTask {
  taskId: string;
  status: CeleryTaskStatus;
  taskType: 'audio';
  userPrompt: string;
  filePath: string;
}

export interface VideoTask {
  taskId: string;
  userPrompt: string;
  filePath: string;
  status: CeleryTaskStatus;
  thumbnailPath?: string; // optional thumbnail path for videos
  taskType: 'video';
}

// Audio Generation Task
interface AudioGenerationPayload {
  prompt: string;
  voice_bytes: string;
  language: string;
}

export type AudioGenerationServerName = 'mock' | 'infinite_talk' | 'zonos';
export interface AudioGenerationTaskRequest
  extends CeleryTaskRequest<AudioGenerationPayload> {
  server_name: AudioGenerationServerName;
  task_name: 'custom_voice_to_audio';
}

// Video Generation Task
interface VideoGenerationPayload {
  prompt: string;
  image_bytes: string;
  audio_bytes: string;
}
export type VideoGenerationServerName = 'mock' | 'infinite_talk';
export interface VideoGenerationTaskRequest
  extends CeleryTaskRequest<VideoGenerationPayload> {
  server_name: VideoGenerationServerName;
  task_name: 'prompt_image_audio_to_video';
}
export interface TaskDocument {
  _id?: string;
  taskId: string;
  avatarId: string;
  status: CeleryTaskStatus;
  taskType: TaskType;
  createdAt: Date;
  updatedAt: Date;
  filePath?: string;
  error?: string;
  userPrompt?: string;
  metadata?: {
    originalRequest?: any;
    resultData?: any;
  };
}
