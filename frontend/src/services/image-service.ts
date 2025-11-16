import { createMediaResponse, fileToBase64, encodeMediaFile } from '@/lib/base64Utils';
import {
  type ImageGenerationTaskRequest,
  ImageTaskType,
  ImageRatio,
  ImageQuality,
  type ImageToImageEditRequest,
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
  avatar?: Avatar | null;
  taskName: string;
  positivePrompt: string;
  negativePrompt: string;
  imageQuality: ImageQuality;
  imageRatio?: ImageRatio;
  promptImage?: ImageToImageEditRequest['payload']['image_bytes'];
};

function createTaskRequest(
  payload: GenerateImagePayload,
): ImageGenerationTaskRequest {
  const isMock = typeof window !== 'undefined'
    ? localStorage.getItem('mock_servers') !== 'false'
    : true;
  return {
    server_name: isMock ? 'mock' : 'qwen_image',
    task_name: payload.taskName,
    payload: {
      positive_prompt: payload.positivePrompt,
      negative_prompt: payload.negativePrompt,
      image_quality: payload.imageQuality,
      ...(payload.imageRatio && { image_ratio: payload.imageRatio }),
      ...(payload.promptImage && { image_bytes: payload.promptImage }),
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
  //if task is image_to_image_edit and no image provided, throw error
  if (
    payload.taskName === 'image_to_image_edit' &&
    !payload.promptImage
  ) {
    throw new Error('No image provided for image-to-image editing');
  }

  if (payload.taskName === 'image_to_image_edit' && typeof payload.promptImage === 'string') {
    // If promptImage is a file path (string), convert it to base64
    try {
      const result = await encodeMediaFile(payload.promptImage);
      payload.promptImage = result.base64;
    } catch (error) {
      throw new Error('Failed to process the provided image for image-to-image editing');
    }
  }

  if (payload.taskName === 'image_to_image_edit' && payload.promptImage instanceof File) {
    // If promptImage is a File, convert it to base64
    try {
      const result = await fileToBase64(payload.promptImage);

      payload.promptImage = result;
    } catch (error) {
      throw new Error('Failed to process the uploaded image for image-to-image editing');
    }
  }
  // Create task request
  const taskRequest = createTaskRequest(payload);

  return { taskRequest };
}
