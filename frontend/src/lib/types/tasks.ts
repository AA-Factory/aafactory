import { CeleryTaskRequest, CeleryTaskStatus } from './celery';

export type TaskType = 'audio' | 'video' | 'image';
export interface AudioTask {
  taskId: string;
  status: CeleryTaskStatus;
  taskType: 'audio';
  taskName: string;
  filePath: string;
  fileName: string;
  avatarId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: {
    taskInfo?: {
      startTime?: string;
      finishTime?: string;
      dialog?: string;
    };
    avatarName?: string;
    resultData?: {
      fileName?: string;
      fileType?: string;
    };
  };
}

export interface VideoTask {
  taskId: string;
  filePath: string;
  status: CeleryTaskStatus;
  thumbnailPath?: string; // optional thumbnail path for videos
  taskType: 'video';
  taskName: string;
  fileName?: string;
  avatarId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: {
    taskInfo?: {
      avatarName?: string;
      startTime?: string;
      finishTime?: string;
      videoPrompt?: string;
      dialog?: string;
      videoConfig?: string;
      lowVram?: boolean;
    };
    videoPrompt?: {
      fileName?: string;
      fileType?: string;
      filePath?: string;
    };
    imagePrompt?: {
      fileName?: string;
      fileType?: string;
      filePath?: string;
    };
    audioPrompt?: {
      fileName?: string;
      fileType?: string;
      filePath?: string;
    };
    resultData?: {
      fileName?: string;
      fileType?: string;
    };
    audioTask?: AudioTask;
  };
}

export interface ImageTask {
  taskId: string;
  filePath: string;
  status: CeleryTaskStatus;
  taskType: 'image';
  taskName: string;
  fileName?: string;
  avatarId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: {
    taskInfo?: {
      avatarName?: string;
      startTime?: string;
      finishTime?: string;
      positivePrompt?: string;
      negativePrompt?: string;
      imageRatio?: ImageRatio;
      imageQuality?: ImageQuality;
    };
    imagePrompt?: {
      fileName?: string;
      fileType?: string;
      filePath?: string;
    };
    resultData?: {
      fileName?: string;
      fileType?: string;
    };
  };
}

export interface BaseTask {
  taskId: string;
  filePath: string;
  status: CeleryTaskStatus;
  thumbnailPath?: string; // optional thumbnail path for videos
  taskType: 'video';
  taskName: string;
  fileName?: string;
  avatarId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: {
    taskInfo?: {
      avatarName?: string;
      startTime?: string;
      finishTime?: string;
      videoPrompt?: string;
      dialog?: string;
      videoConfig?: string;
      lowVram?: boolean;
    };
    imagePrompt?: {
      fileName?: string;
      fileType?: string;
      filePath?: string;
    };
    audioPrompt?: {
      fileName?: string;
      fileType?: string;
      filePath?: string;
    };
    resultData?: {
      fileName?: string;
      fileType?: string;
    };
    audioTask?: AudioTask;
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

// Animation Generation Payload (for wan_animate)
export interface AnimationGenerationPayload {
  image_bytes: string;
  video_bytes: string;
}

export type VideoGenerationServerName = 'mock' | 'infinite_talk' | 'wan_animate';

export type BaseInfiniteTalkRequest = Omit<
  CeleryTaskRequest<VideoGenerationPayload>,
  'server_name' | 'task_name'
> & {
  server_name: 'mock' | 'infinite_talk';
  task_name: 'prompt_image_audio_to_video';
};

export type BaseWanAnimateRequest = {
  server_name: 'mock' | 'wan_animate';
  task_name: string;
} & CeleryTaskRequest<AnimationGenerationPayload>;

export type VideoGenerationTaskRequest = BaseInfiniteTalkRequest | BaseWanAnimateRequest;

// Image Generation Task
export type ImageRatio = '1:1' | '4:5' | '16:9' | '9:16';
export type ImageQuality = 'low' | 'medium' | 'high' | 'ultra';
export type ImageTaskType = 'text_to_image' | 'image_to_image_edit';
interface ImageGenerationPayload {
  // task_name: ImageTaskType;
  positive_prompt: string;
  negative_prompt: string;
  image_ratio?: ImageRatio | undefined;
  image_quality: ImageQuality;
  image_bytes?: string | null;
}
export type ImageGenerationServerName = 'mock' | 'qwen_image';

type BaseImageGenerationTaskRequest = {
  server_name: ImageGenerationServerName;
} & CeleryTaskRequest<ImageGenerationPayload>;

type TextToImageRequest = BaseImageGenerationTaskRequest & {
  task_name: string;
};

export type ImageToImageEditRequest = BaseImageGenerationTaskRequest & {
  task_name: string;
  image_bytes?: string; // or Uint8Array, Buffer, etc. depending on your needs
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
  taskName: string;
  createdAt: Date;
  updatedAt: Date;
  filePath?: string;
  error?: string;
  metadata?: {
    taskInfo?: {
      startTime?: string;
      finishTime?: string;
      [key: string]: any;
    };
    originalRequest?: any;
    resultData?: {
      fileName?: string;
      fileType?: string;
    };
  };
}
