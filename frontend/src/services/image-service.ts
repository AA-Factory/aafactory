import { createMediaResponse } from '@/lib/base64Utils';
import {
  type ImageGenerationTaskRequest,
  ImageTaskType,
  ImageRatio,
  ImageQuality,
} from '@/lib/types/tasks';
import { Avatar } from '@/lib/types/avatar';
// Types

type GenerateImageResponse = {
  imageUrl: string;
  filename: string;
  taskId: string;
  base64Image: string;
};

export type GenerateImagePayload = {
  taskName?: ImageTaskType;
  avatar?: Avatar | null;
  positivePrompt: string;
  negativePrompt?: string;
  imageRatio?: ImageRatio;
  imageQuality?: ImageQuality;
  base64Image?: string | null;
};

function createTaskRequest(
  payload: GenerateImagePayload,
): ImageGenerationTaskRequest {
  const isMock = typeof window !== 'undefined' && localStorage.getItem('mock_qwen_image') === 'true';

  return {
    server_name: isMock ? 'mock' : 'qwen_image',
    task_name: payload.taskName || 'text_to_image',
    payload: {
      positive_prompt: payload.positivePrompt,
      ...(payload.negativePrompt && {
        negative_prompt: payload.negativePrompt,
      }),
      ...(payload.imageRatio && { image_ratio: payload.imageRatio }),
      ...(payload.imageQuality && { image_quality: payload.imageQuality }),
      ...(payload.base64Image && { image_bytes: payload.base64Image }),
    },
  };
}

export function createImageResponse(
  base64Image: string,
  taskId: string,
): GenerateImageResponse {
  const response = createMediaResponse(base64Image, taskId, 'image');
  return {
    base64Image: response.base64,
    imageUrl: response.url,
    filename: response.filename,
    taskId: response.taskId,
  };
}

// Main service function
export async function prepareImageData(
  payload: GenerateImagePayload,
): Promise<{ taskRequest: ImageGenerationTaskRequest }> {
  if (!payload.positivePrompt?.trim()) {
    throw new Error('No positive prompt provided');
  }

  // Create task request
  const taskRequest = createTaskRequest(payload);

  return { taskRequest };
}
