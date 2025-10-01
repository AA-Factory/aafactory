import { CeleryTaskRequest } from './celery';

export interface AudioTask {
  taskId: string;
  status: 'PENDING' | 'RECEIVED' | 'STARTED' | 'SUCCESS' | 'FAILURE';
  taskType: 'audio';
  userPrompt: string;
  filePath: string;
}

export interface VideoTask {
  taskId: string;
  userPrompt: string;
  filePath: string;
  status: 'PENDING' | 'RECEIVED' | 'STARTED' | 'SUCCESS' | 'FAILURE';
  thumbnailPath?: string; // optional thumbnail path for videos
  taskType: 'video' | 'OTHER'; // to differentiate task types if needed
}

// Audio Generation Task
interface AudioGenerationPayload {
  prompt: string;
  voice_bytes: string;
  language: string;
}

export interface AudioGenerationTaskRequest
  extends CeleryTaskRequest<AudioGenerationPayload> {
  server_name: 'mock' | 'infinite_talk' | 'zonos';
  task_name: 'custom_voice_to_audio';
}

// Video Generation Task
interface VideoGenerationPayload {
  prompt: string;
  image_bytes: string;
  audio_bytes: string;
}

export interface VideoGenerationTaskRequest
  extends CeleryTaskRequest<VideoGenerationPayload> {
  server_name: 'mock' | 'infinite_talk';
  task_name: 'prompt_image_audio_to_video';
}
