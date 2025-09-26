import { Avatar } from "@/types/avatar";
import {
  encodeMediaFile,
  createMediaResponse
} from "@/utils/base64Utils";
import {
  type AudioGenerationTaskRequest
} from "@/types/celery";
import { startTask, pollTaskStatus } from "@/services/shared/taskService";

// Constants
const DEFAULT_LANGUAGE = "en-us";

// Types
export type AudioSource = 'avatar' | 'rick_and_morty' | 'japanese';

export type GenerateAudioPayload = {
  dialog: string;
  avatar: Avatar | null;
  language?: string;
  async?: boolean;
  audioSource?: AudioSource;
};

export type GenerateAudioResponse = {
  audioUrl: string;
  filename: string;
  promptId: string;
  base64Audio: string;
};



export async function getTrainingAudioForSource(
  avatar: Avatar | null,
  audioSource: AudioSource = 'avatar'
): Promise<string | File | null> {
  // Handle specific sources
  if (audioSource === 'rick_and_morty') {
    return 'rick_and_morty_voice_training.wav';
  }

  if (audioSource === 'japanese') {
    return 'japanese_voice_training.wav';
  }

  // Handle avatar source
  if (audioSource === 'avatar' && avatar?.trainingAudioPath) {
    try {
      const audioResponse = await fetch(avatar.trainingAudioPath);
      if (audioResponse.ok) {
        const audioBlob = await audioResponse.blob();
        const audioFile = new File([audioBlob], avatar.trainingAudioFileName || 'training_audio.wav');
        return audioFile;
      }
    } catch (error) {
      console.warn('Failed to load uploaded training audio:', error);
    }
  }

  // Fallback
  return 'rick_and_morty_voice_training.wav';
}

export async function startAudioGenerationTask(requestData: AudioGenerationTaskRequest): Promise<string> {
  return await startTask(requestData);
}

export async function pollAudioTaskStatus(taskId: string): Promise<string> {
  return await pollTaskStatus(taskId, 'AUDIO');
}

export function createTaskRequest(payload: GenerateAudioPayload, audioBase64: string): AudioGenerationTaskRequest {
  const language = payload.language || DEFAULT_LANGUAGE;

  return {
    server_name: process.env.NEXT_PUBLIC_MOCK_SERVER === 'true' ? "mock" : "infinite_talk",
    task_name: "custom_voice_to_audio",
    payload: {
      text: payload.dialog,
      voice_sample: audioBase64,
      language,
    }
  };
}

export function createAudioResponse(base64Audio: string, taskId: string): GenerateAudioResponse {
  const response = createMediaResponse(base64Audio, taskId, 'audio');
  return {
    base64Audio: response.base64,
    audioUrl: response.url,
    filename: response.filename,
    promptId: response.promptId,
  };
}

// Main service function
export async function generateAudio(payload: GenerateAudioPayload): Promise<GenerateAudioResponse> {
  if (!payload.avatar) {
    throw new Error("No avatar provided for audio generation");
  }

  if (!payload.dialog?.trim()) {
    throw new Error("No dialog text provided");
  }

  // Get training audio
  const trainingAudio = await getTrainingAudioForSource(
    payload.avatar,
    payload.audioSource || 'avatar'
  );

  if (!trainingAudio) {
    throw new Error("No training audio available");
  }

  // Encode audio
  const { base64: audioBase64 } = await encodeMediaFile(trainingAudio, '/test/training_audio/');

  // Create and start task
  const requestData = createTaskRequest(payload, audioBase64);
  const taskId = await startAudioGenerationTask(requestData);

  // Poll for result
  const base64Audio = await pollAudioTaskStatus(taskId);

  // Create response
  return createAudioResponse(base64Audio, taskId);
}