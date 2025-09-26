/**
 * Celery task types for API communication
 */

// Base Celery Task Status
export type CeleryTaskStatus = 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'RETRY';

// Generic Celery Task Request
export interface CeleryTaskRequest<T = Record<string, any>> {
  server_name: string;
  task_name: string;
  payload: T;
}

// Generic Celery Task Response
export interface CeleryTaskResponse {
  task_id: string;
  status: string;
  message?: string;
}

// Generic Celery Task Status Response
export interface CeleryTaskStatusResponse<T = any> {
  status: CeleryTaskStatus;
  result?: T;
  error?: string;
  traceback?: string;
  task_id?: string;
  timestamp?: string;
}

// Specific Task Payloads

// Audio Generation Task
export interface AudioGenerationPayload {
  text: string;
  voice_sample: string;
  language: string;
}

export interface AudioGenerationTaskRequest extends CeleryTaskRequest<AudioGenerationPayload> {
  server_name: 'mock' | 'infinite_talk' | 'zonos';
  task_name: 'custom_voice_to_audio';
}

// Video Generation Task
export interface VideoGenerationPayload {
  prompt: string;
  image_bytes: string;
  audio_bytes: string;
}

export interface VideoGenerationTaskRequest extends CeleryTaskRequest<VideoGenerationPayload> {
  server_name: 'mock' | 'infinite_talk';
  task_name: 'prompt_image_audio_to_video';
}

// Task Result Types
export interface AudioGenerationResult {
  audio_data: string;
  filename: string;
  duration?: number;
  sample_rate?: number;
}

export interface VideoGenerationResult {
  video_data: string;
  filename: string;
  duration?: number;
  size?: number;
  format: string;
}

// Utility Types
export type CeleryServerName = 'mock' | 'infinite_talk';

export type CeleryTaskName =
  | 'custom_voice_to_audio'
  | 'prompt_image_audio_to_video';

// Type guards
export function isCeleryTaskResponse(obj: any): obj is CeleryTaskResponse {
  return obj && typeof obj.task_id === 'string' && typeof obj.status === 'string';
}

export function isCeleryTaskStatusResponse(obj: any): obj is CeleryTaskStatusResponse {
  return obj && typeof obj.status === 'string' && ['PENDING', 'STARTED', 'SUCCESS', 'FAILURE', 'RETRY'].includes(obj.status);
}

export function isAudioGenerationResult(obj: any): obj is AudioGenerationResult {
  return obj && typeof obj.audio_data === 'string' && typeof obj.filename === 'string';
}

export function isVideoGenerationResult(obj: any): obj is VideoGenerationResult {
  return obj && typeof obj.video_data === 'string' && typeof obj.filename === 'string';
}