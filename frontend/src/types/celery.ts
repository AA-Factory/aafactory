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
  server_name: 'zonos';
  task_name: 'custom_voice_to_audio';
}

// Image Generation Task
export interface ImageGenerationPayload {
  prompt: string;
  style?: string;
  width?: number;
  height?: number;
  seed?: number;
}

export interface ImageGenerationTaskRequest extends CeleryTaskRequest<ImageGenerationPayload> {
  server_name: 'image-generator';
  task_name: 'generate_image';
}

// Video Processing Task
export interface VideoProcessingPayload {
  video_data: string;
  processing_type: 'enhance' | 'compress' | 'convert';
  output_format?: string;
  quality?: number;
}

export interface VideoProcessingTaskRequest extends CeleryTaskRequest<VideoProcessingPayload> {
  server_name: 'video-processor';
  task_name: 'process_video';
}

// Chat/Text Generation Task
export interface ChatGenerationPayload {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatGenerationTaskRequest extends CeleryTaskRequest<ChatGenerationPayload> {
  server_name: 'infinite-talk';
  task_name: 'generate_chat_response';
}

// Task Result Types
export interface AudioGenerationResult {
  audio_data: string;
  filename: string;
  duration?: number;
  sample_rate?: number;
}

export interface ImageGenerationResult {
  image_data: string;
  filename: string;
  width: number;
  height: number;
  format: string;
}

export interface VideoProcessingResult {
  video_data: string;
  filename: string;
  duration?: number;
  size?: number;
  format: string;
}

export interface ChatGenerationResult {
  response: string;
  model_used: string;
  tokens_used?: number;
  finish_reason?: string;
}

// Utility Types
export type CeleryServerName = 'zonos' | 'infinite-talk' | 'image-generator' | 'video-processor';

export type CeleryTaskName =
  | 'custom_voice_to_audio'
  | 'generate_image'
  | 'process_video'
  | 'generate_chat_response';

// Error Types
export interface CeleryErrorResult {
  error_type: string;
  error_message: string;
  error_code?: string;
  retry_after?: number;
}

// Progress Types (for long-running tasks)
export interface CeleryProgressResult {
  current: number;
  total: number;
  status: string;
  percentage?: number;
}

// Batch Task Types
export interface BatchTaskRequest<T = Record<string, any>> {
  tasks: Array<CeleryTaskRequest<T>>;
  batch_id?: string;
  parallel?: boolean;
}

export interface BatchTaskResponse {
  batch_id: string;
  task_ids: string[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export interface BatchTaskStatusResponse {
  batch_id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  completed_tasks: number;
  total_tasks: number;
  results: Array<CeleryTaskStatusResponse>;
  errors?: Array<CeleryErrorResult>;
}

// Webhook Types (for task completion notifications)
export interface CeleryWebhookPayload {
  task_id: string;
  status: CeleryTaskStatus;
  result?: any;
  error?: CeleryErrorResult;
  timestamp: string;
  webhook_url?: string;
}

// Queue Information
export interface CeleryQueueInfo {
  name: string;
  messages: number;
  consumers: number;
  memory_usage?: number;
}

export interface CeleryWorkerInfo {
  hostname: string;
  status: 'online' | 'offline';
  active_tasks: number;
  processed_tasks: number;
  load_average?: number[];
}

// Task Monitoring
export interface CeleryTaskStats {
  task_name: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_runtime: number;
  last_execution?: string;
}

// Type guards
export function isCeleryTaskResponse(obj: any): obj is CeleryTaskResponse {
  return obj && typeof obj.task_id === 'string' && typeof obj.status === 'string';
}

export function isCeleryTaskStatusResponse(obj: any): obj is CeleryTaskStatusResponse {
  return obj && typeof obj.status === 'string' && ['PENDING', 'STARTED', 'SUCCESS', 'FAILURE', 'RETRY'].includes(obj.status);
}

export function isCeleryErrorResult(obj: any): obj is CeleryErrorResult {
  return obj && typeof obj.error_type === 'string' && typeof obj.error_message === 'string';
}

export function isAudioGenerationResult(obj: any): obj is AudioGenerationResult {
  return obj && typeof obj.audio_data === 'string' && typeof obj.filename === 'string';
}

export function isImageGenerationResult(obj: any): obj is ImageGenerationResult {
  return obj && typeof obj.image_data === 'string' && typeof obj.filename === 'string' && typeof obj.width === 'number' && typeof obj.height === 'number';
}

export function isVideoProcessingResult(obj: any): obj is VideoProcessingResult {
  return obj && typeof obj.video_data === 'string' && typeof obj.filename === 'string' && typeof obj.format === 'string';
}

export function isChatGenerationResult(obj: any): obj is ChatGenerationResult {
  return obj && typeof obj.response === 'string' && typeof obj.model_used === 'string';
}