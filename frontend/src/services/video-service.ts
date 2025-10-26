import { encodeMediaFile, createMediaResponse } from '@/lib/base64Utils';
import {
  type VideoGenerationTaskRequest,
  VideoGenerationConfig,
  VideoGenerationPayload,
} from '@/lib/types/tasks';
import { Avatar } from '@/lib/types/avatar';

// Types
export type GenerateVideoPayload = {
  avatar: Avatar;
  imageSrc: string; // Avatar image source URL
  audioBase64?: string; // Optional - Base64 audio data from useGenerateAudio (not used in API)
  prompt: string;
  config?: VideoGenerationConfig;
  lowVram?: boolean;
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
): VideoGenerationTaskRequest {

  const isMock = typeof window !== 'undefined' && localStorage.getItem('mock_infinite_talk') === 'true';

  return {
    server_name: isMock ? 'mock' : 'infinite_talk',
    task_name: 'prompt_image_audio_to_video',
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
  taskRequest: VideoGenerationTaskRequest;
  imageBase64: string;
  audioBase64: string;
}> {
  if (!payload.avatar?.id) {
    throw new Error('No avatar ID provided for video generation');
  }

  if (!payload.prompt?.trim()) {
    throw new Error('No prompt text provided');
  }

  if (!payload.imageSrc) {
    throw new Error('Image source is missing');
  }

  // Encode avatar image
  const { base64: imageBase64 } = await encodeMediaFile(`image/${payload.imageSrc}`);

  // Format audio data - extract raw base64 if it has data URL prefix
  const rawAudioBase64 = payload.audioBase64?.includes(',')
    ? payload.audioBase64.split(',')[1]
    : payload.audioBase64 || '';

  // Create task request
  const taskRequest = createTaskRequest(payload, imageBase64, rawAudioBase64);

  return { taskRequest, imageBase64, audioBase64: rawAudioBase64 };
}
