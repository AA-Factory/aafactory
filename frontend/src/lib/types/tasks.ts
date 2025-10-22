import { CeleryTaskRequest, CeleryTaskStatus } from './celery';

export type TaskType = 'audio' | 'video' | 'image';
export interface AudioTask {
  taskId: string;
  status: CeleryTaskStatus;
  taskType: 'audio';
  userPrompt: string;
  filePath: string;
  fileName: string;
}

export interface VideoTask {
  taskId: string;
  userPrompt: string;
  filePath: string;
  status: CeleryTaskStatus;
  thumbnailPath?: string; // optional thumbnail path for videos
  taskType: 'video';
  fileName?: string;
}

export interface ImageTask {
  taskId: string;
  userPrompt: string;
  filePath: string;
  status: CeleryTaskStatus;
  taskType: 'image';
  fileName?: string;
  metadata?: {
    resultData?: {
      fileType?: string;
    };
  };
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
export type VideoGenerationConfig =
  | '6_steps'
  | '8_steps'
  | 'high_quality'
  | 'medium_quality'
  | 'quantize_model';
export interface VideoGenerationPayload {
  prompt: string;
  image_bytes: string;
  audio_bytes: string;
  config?: VideoGenerationConfig;
  low_vram?: boolean;
}
export type VideoGenerationServerName = 'mock' | 'infinite_talk';
export interface VideoGenerationTaskRequest
  extends CeleryTaskRequest<VideoGenerationPayload> {
  server_name: VideoGenerationServerName;
  task_name: 'prompt_image_audio_to_video';
}

// Image Generation Task
export type ImageRatio = '1:1' | '4:5' | '16:9' | '9:16';
export type ImageQuality = 'low' | 'medium' | 'high' | 'ultra';
export type ImageTaskType = 'text_to_image' | 'image_to_image_edit';
interface ImageGenerationPayload {
  task_name?: ImageTaskType;
  positive_prompt: string;
  negative_prompt: string;
  image_ratio: ImageRatio;
  image_quality: ImageQuality;
  image_bytes: string | null;
}
export type ImageGenerationServerName = 'mock' | 'qwen_image';

type BaseImageGenerationTaskRequest = {
  server_name: ImageGenerationServerName;
} & CeleryTaskRequest<ImageGenerationPayload>;

type TextToImageRequest = BaseImageGenerationTaskRequest & {
  task_name: 'text_to_image';
};

type ImageToImageEditRequest = BaseImageGenerationTaskRequest & {
  task_name: 'image_to_image_edit';
  image_bytes: string; // or Uint8Array, Buffer, etc. depending on your needs
};

export type ImageGenerationTaskRequest =
  | TextToImageRequest
  | ImageToImageEditRequest;
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
    resultData?: {
      fileName?: string;
      fileType?: string;
    };
  };
}
