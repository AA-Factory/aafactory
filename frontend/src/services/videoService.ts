import { Avatar } from '@/types/avatar';
import { encodeMediaFile, createMediaResponse } from '@/lib/base64Utils';
import { type VideoGenerationTaskRequest } from '@/types/celery';

// Types
export type GenerateVideoPayload = {
  prompt: string;
  audioBase64?: string; // Optional - Base64 audio data from useGenerateAudio (not used in API)
  avatar: Avatar | null; // Avatar object containing image
  async?: boolean;
};

export type GenerateVideoResponse = {
  videoUrl: string;
  filename: string;
  promptId: string;
  base64Video: string;
};

export function createTaskRequest(
  payload: GenerateVideoPayload,
  imageBase64: string,
  audioBase64: string,
): VideoGenerationTaskRequest {
  return {
    server_name:
      process.env.NEXT_PUBLIC_MOCK_SERVER === 'true' ? 'mock' : 'infinite_talk',
    task_name: 'prompt_image_audio_to_video',
    payload: {
      prompt: payload.prompt,
      image_bytes: imageBase64,
      audio_bytes: audioBase64,
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
    promptId: response.promptId,
  };
}

// Main service function
export async function prepareVideoData(payload: GenerateVideoPayload): Promise<{
  taskRequest: VideoGenerationTaskRequest;
  imageBase64: string;
  audioBase64: string;
}> {
  if (!payload.avatar) {
    throw new Error('No avatar provided for video generation');
  }

  if (!payload.prompt?.trim()) {
    throw new Error('No prompt text provided');
  }

  if (!payload.avatar.src) {
    throw new Error('Avatar image source is missing');
  }

  // Encode avatar image
  const { base64: imageBase64 } = await encodeMediaFile(payload.avatar.src);

  // Format audio data - extract raw base64 if it has data URL prefix
  const rawAudioBase64 = payload.audioBase64?.includes(',')
    ? payload.audioBase64.split(',')[1]
    : payload.audioBase64 || '';

  // Create task request
  const taskRequest = createTaskRequest(payload, imageBase64, rawAudioBase64);

  return { taskRequest, imageBase64, audioBase64: rawAudioBase64 };
}
