import { createMediaResponse, fileToBase64, encodeMediaFile, isValidBase64 } from '@/lib/base64Utils';
import {
  type VideoGenerationConfig,
  BaseInfiniteTalkRequest,
} from '@/lib/types/tasks';
import { Avatar } from '@/lib/types/avatar';
import { AudioTask } from '@/lib/types/tasks';
// Types
export type GenerateVideoPayload = {
  avatar: Avatar;
  imageFilePath: string; // Avatar image source URL
  imageFileName: string; // Avatar image file name
  audioPrompt?: string | File; // Audio in base64 or File format
  prompt: string;
  dialog?: string;
  audioTask?: AudioTask | null;
  config?: VideoGenerationConfig;
  lowVram?: boolean;
  taskName: 'prompt_image_audio_to_video';
};

export type GenerateVideoResponse = {
  videoUrl: string;
  filename: string;
  taskId: string;
  base64Video: string;
};

function createTaskRequest(
  payload: GenerateVideoPayload,
  imageBase64: string,
  audioBase64: string,
): BaseInfiniteTalkRequest {
  const isMock = typeof window !== 'undefined'
    ? localStorage.getItem('mock_servers') !== 'false'
    : true;
  return {
    server_name: isMock ? 'mock' : 'infinite_talk',
    task_name: payload.taskName,
    payload: {
      prompt: payload.prompt,
      image_bytes: imageBase64,
      audio_bytes: audioBase64,
      config: payload.config,
      low_vram: payload.lowVram,
    },
  };
}

export function createVideoResponse(
  base64Video: string,
  taskId: string,
): GenerateVideoResponse {
  const response = createMediaResponse(base64Video, taskId, 'video');
  return {
    base64Video: response.base64,
    videoUrl: response.url,
    filename: response.filename,
    taskId: response.taskId,
  };
}

// Main service function
export async function prepareVideoData(payload: GenerateVideoPayload): Promise<{
  taskRequest: BaseInfiniteTalkRequest;
  imageBase64: string;
  audioBase64: string;
}> {
  if (!payload.avatar?.id) {
    throw new Error('No avatar ID provided for video generation');
  }

  if (!payload.prompt?.trim()) {
    throw new Error('No prompt text provided');
  }

  if (!payload.imageFilePath || !payload.imageFileName) {
    throw new Error('Image file path or name is missing');
  }

  // Encode avatar image
  const { base64: imageBase64 } = await encodeMediaFile(payload.imageFilePath);

  let audioBase64 = '';
  if (payload.audioPrompt) {
    if (typeof payload.audioPrompt === 'string' && isValidBase64(payload.audioPrompt)) {
      audioBase64 = payload.audioPrompt;
    } else if (typeof payload.audioPrompt === 'string') {
      // If audioPrompt is a file path (string), convert it to base64
      const result = await encodeMediaFile(payload.audioPrompt);
      audioBase64 = result.base64;
    } else if (payload.audioPrompt instanceof File) {
      // If audioPrompt is a File object, convert it to base64
      audioBase64 = await fileToBase64(payload.audioPrompt);
    } else {
      throw new Error('Invalid audio prompt format');
    }
  }

  const rawAudioBase64 = audioBase64;
  // Create task request
  const taskRequest = createTaskRequest(payload, imageBase64, rawAudioBase64);

  return { taskRequest, imageBase64, audioBase64: rawAudioBase64 };
}
