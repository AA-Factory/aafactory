import { encodeMediaFile, createMediaResponse, fileToBase64 } from '@/lib/base64Utils';
import {
  type BaseWanAnimateRequest,
} from '@/lib/types/tasks';
import { Avatar } from '@/lib/types/avatar';

// Types
export type GenerateAnimationPayload = {
  avatar: Avatar;
  taskName: string;
  imageFilePath: string; // Avatar image source URL
  imageFileName: string; // Avatar image file name
  videoPrompt: string | File; // Video prompt can be a file or a URL
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
): BaseWanAnimateRequest {
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
  taskRequest: BaseWanAnimateRequest;
  imageBase64: string;
  videoBase64: string;
}> {
  if (!payload.avatar?.id) {
    throw new Error('No avatar ID provided for animation generation');
  }

  if (!payload.imageFilePath || !payload.imageFileName) {
    throw new Error('Image file path or name is missing');
  }

  if (!payload.videoPrompt) {
    throw new Error('Video file is missing');
  }

  // Encode avatar image
  const { base64: imageBase64 } = await encodeMediaFile(payload.imageFilePath);
  let videoBase64 = '';
  // Encode video file to base64
  if (payload.videoPrompt instanceof File) {
    videoBase64 = await fileToBase64(payload.videoPrompt);
  } else if (typeof payload.videoPrompt === 'string') {
    const { base64 } = await encodeMediaFile(payload.videoPrompt);
    videoBase64 = base64;
  } else {
    throw new Error('Video file or video file path must be provided');
  }

  // Create task request
  const taskRequest = createTaskRequest(payload, imageBase64, videoBase64);

  return { taskRequest, imageBase64, videoBase64 };
}
