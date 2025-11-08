import { encodeMediaFile, createMediaResponse } from '@/lib/base64Utils';
import {
  type VideoGenerationTaskRequest,
} from '@/lib/types/tasks';
import { Avatar } from '@/lib/types/avatar';

// Types
export type GenerateAnimationPayload = {
  avatar: Avatar;
  imageSrc: string; // Avatar image source URL
  videoFile: File; // Video file to upload
};

export type GenerateAnimationResponse = {
  videoUrl: string;
  filename: string;
  taskId: string;
  base64Video: string;
};

function createTaskRequest(
  payload: GenerateAnimationPayload,
  imageBase64: string,
  videoBase64: string,
): VideoGenerationTaskRequest {
  const isMock = typeof window !== 'undefined'
    ? localStorage.getItem('mock_servers') !== 'false'
    : true;
  return {
    server_name: isMock ? 'mock' : 'wan_animate',
    task_name: 'image_and_video_to_video',
    payload: {
      image_bytes: imageBase64,
      video_bytes: videoBase64,
    },
  };
}

export function createAnimationResponse(
  base64Video: string,
  taskId: string,
): GenerateAnimationResponse {
  const response = createMediaResponse(base64Video, taskId, 'video');
  return {
    base64Video: response.base64,
    videoUrl: response.url,
    filename: response.filename,
    taskId: response.taskId,
  };
}

// Main service function
export async function prepareAnimationData(payload: GenerateAnimationPayload): Promise<{
  taskRequest: VideoGenerationTaskRequest;
  imageBase64: string;
  videoBase64: string;
}> {
  if (!payload.avatar?.id) {
    throw new Error('No avatar ID provided for animation generation');
  }

  if (!payload.imageSrc) {
    throw new Error('Image source is missing');
  }

  if (!payload.videoFile) {
    throw new Error('Video file is missing');
  }

  // Encode avatar image
  const { base64: imageBase64 } = await encodeMediaFile(payload.imageSrc);

  // Encode video file to base64
  const videoBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix if present
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(payload.videoFile);
  });

  // Create task request
  const taskRequest = createTaskRequest(payload, imageBase64, videoBase64);

  return { taskRequest, imageBase64, videoBase64 };
}
