import { Avatar } from '@/lib/types/avatar';
import { encodeMediaFile, createMediaResponse } from '@/lib/base64Utils';
import { type AudioGenerationTaskRequest } from '@/lib/types/tasks';
import { DEFAULT_LANGUAGE } from '@/lib/task/constants';
import { DEFAULT_AVATAR_TRAINING_AUDIOS } from '@/lib/avatar/constants';
// Types
type AudioSource = 'avatar' | 'rick_and_morty' | 'japanese';

export type GenerateAudioPayload = {
  dialog: string;
  avatar: Avatar | null;
  language?: string;
  audioSource?: AudioSource;
};

type GenerateAudioResponse = {
  audioUrl: string;
  filename: string;
  taskId: string;
  base64Audio: string;
};

async function getTrainingAudioForSource(
  avatar: Avatar | null,
  audioSource: AudioSource = 'avatar',
): Promise<string | File | null> {
  // Handle specific sources
  if (audioSource === 'rick_and_morty') {
    return DEFAULT_AVATAR_TRAINING_AUDIOS.rick_and_morty.filename;
  }

  if (audioSource === 'japanese') {
    return DEFAULT_AVATAR_TRAINING_AUDIOS.japanese.filename;
  }

  // Handle avatar source
  if (audioSource === 'avatar' && avatar?.trainingAudioPath) {
    try {
      const audioResponse = await fetch(avatar.trainingAudioPath);
      if (audioResponse.ok) {
        const audioBlob = await audioResponse.blob();
        const audioFile = new File(
          [audioBlob],
          avatar.trainingAudioFileName || 'training_audio.wav',
        );
        return audioFile;
      }
    } catch (error) {
      console.warn('Failed to load uploaded training audio:', error);
    }
  }

  // Fallback
  return DEFAULT_AVATAR_TRAINING_AUDIOS.default.filename;
}

function createTaskRequest(
  payload: GenerateAudioPayload,
  audioBase64: string,
): AudioGenerationTaskRequest {
  const language = payload.language || DEFAULT_LANGUAGE;
  const isMock = typeof window !== 'undefined' && localStorage.getItem('mock_zonos') === 'true';

  return {
    server_name: isMock ? 'mock' : 'zonos',
    task_name: 'custom_voice_to_audio',
    payload: {
      prompt: payload.dialog,
      voice_bytes: audioBase64,
      language,
    },
  };
}

export function createAudioResponse(
  base64Audio: string,
  taskId: string,
): GenerateAudioResponse {
  const response = createMediaResponse(base64Audio, taskId, 'audio');
  return {
    base64Audio: response.base64,
    audioUrl: response.url,
    filename: response.filename,
    taskId: response.taskId,
  };
}

// Main service function
export async function prepareAudioData(
  payload: GenerateAudioPayload,
): Promise<{ taskRequest: AudioGenerationTaskRequest; audioBase64: string }> {
  if (!payload.avatar) {
    throw new Error('No avatar provided for audio generation');
  }

  if (!payload.dialog?.trim()) {
    throw new Error('No dialog text provided');
  }

  // Get training audio
  const trainingAudio = await getTrainingAudioForSource(
    payload.avatar,
    payload.audioSource || 'avatar',
  );

  if (!trainingAudio) {
    throw new Error('No training audio available');
  }

  // Encode audio
  const { base64: audioBase64 } = await encodeMediaFile(
    trainingAudio,
    '/test/training_audio/',
  );

  // Create task request
  const taskRequest = createTaskRequest(payload, audioBase64);

  return { taskRequest, audioBase64 };
}
