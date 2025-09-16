import { Avatar } from "@/types/avatar";
import { CELERY_RUN_TASK, CELERY_TASK_STATUS } from "@/config/constants";
import {
  base64ToBlob,
  encodeAudioFile,
  base64ToObjectUrl,
  type Base64Error,
  EncodingError as Base64EncodingError,
  DecodingError as Base64DecodingError
} from "@/utils/base64Utils";
import {
  type AudioGenerationTaskRequest,
  type CeleryTaskResponse,
  type CeleryTaskStatusResponse,
  type AudioGenerationResult,
  isCeleryTaskResponse,
  isCeleryTaskStatusResponse,
  isAudioGenerationResult
} from "@/types/celery";

// Constants
const POLLING_CONFIG = {
  INTERVAL: 5000, // 5 seconds
  MAX_ATTEMPTS: 60, // 5 minutes total
  TIMEOUT: 300000, // 5 minutes in ms
} as const;

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


// Custom Error Classes
export class AudioGenerationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AudioGenerationError';
  }
}

export class TaskTimeoutError extends AudioGenerationError {
  constructor() {
    super('Audio generation timed out. Please try again.', 'TIMEOUT');
  }
}

export class TrainingAudioError extends AudioGenerationError {
  constructor(message: string) {
    super(message, 'TRAINING_AUDIO');
  }
}

export async function getTrainingAudioForSource(
  avatar: Avatar | null,
  audioSource: AudioSource = 'avatar'
): Promise<string | File | null> {
  try {
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
  } catch (error) {
    throw new TrainingAudioError(`Failed to get training audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function startAudioGenerationTask(requestData: AudioGenerationTaskRequest): Promise<string> {
  try {
    const response = await fetch(CELERY_RUN_TASK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new AudioGenerationError(`Request failed with status: ${response.status}`, 'REQUEST_FAILED');
    }

    const result: CeleryTaskResponse = await response.json();

    if (!isCeleryTaskResponse(result) || result.status !== 'PENDING') {
      throw new AudioGenerationError('Failed to start task: Invalid response', 'TASK_START_FAILED');
    }

    return result.task_id;
  } catch (error) {
    if (error instanceof AudioGenerationError) throw error;
    throw new AudioGenerationError(
      `Failed to start audio generation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'NETWORK_ERROR'
    );
  }
}

export async function pollTaskStatus(taskId: string): Promise<string> {
  let attempts = 0;
  const startTime = Date.now();

  while (attempts < POLLING_CONFIG.MAX_ATTEMPTS) {
    // Check timeout
    if (Date.now() - startTime > POLLING_CONFIG.TIMEOUT) {
      throw new TaskTimeoutError();
    }

    try {
      const statusResponse = await fetch(`${CELERY_TASK_STATUS}${taskId}`);

      if (!statusResponse.ok) {
        throw new AudioGenerationError(`Status check failed: ${statusResponse.status}`, 'STATUS_CHECK_FAILED');
      }

      const taskResult: CeleryTaskStatusResponse = await statusResponse.json();

      if (!isCeleryTaskStatusResponse(taskResult)) {
        throw new AudioGenerationError('Invalid task status response', 'INVALID_STATUS_RESPONSE');
      }

      if (taskResult.status === 'SUCCESS') {
        if (!taskResult.result) {
          throw new AudioGenerationError('No result returned from task', 'NO_RESULT');
        }
        return taskResult.result;
      }

      if (taskResult.status === 'FAILURE') {
        throw new AudioGenerationError(taskResult.error || 'Task failed', 'TASK_FAILED');
      }

      // Continue polling for PENDING, STARTED, RETRY
      await new Promise(resolve => setTimeout(resolve, POLLING_CONFIG.INTERVAL));
      attempts++;
    } catch (error) {
      if (error instanceof AudioGenerationError) throw error;
      throw new AudioGenerationError(
        `Polling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'POLLING_ERROR'
      );
    }
  }

  throw new TaskTimeoutError();
}

export function createTaskRequest(payload: GenerateAudioPayload, audioBase64: string): AudioGenerationTaskRequest {
  const language = payload.language || DEFAULT_LANGUAGE;

  return {
    server_name: "zonos",
    task_name: "custom_voice_to_audio",
    payload: {
      text: payload.dialog,
      voice_sample: audioBase64,
      language,
    }
  };
}

export function createAudioResponse(base64Audio: string, taskId: string): GenerateAudioResponse {
  try {
    // Handle case where base64Audio might be wrapped in an object
    const audioData = typeof base64Audio === 'string' ? base64Audio : (base64Audio as any).message;

    const audioUrl = base64ToObjectUrl(audioData, 'audio/wav');
    const filename = `generated_audio_${Date.now()}.wav`;

    return {
      base64Audio: audioData,
      audioUrl,
      filename,
      promptId: taskId,
    };
  } catch (error) {
    if (error instanceof Base64Error) {
      throw new AudioGenerationError(`Failed to create audio response: ${error.message}`, 'AUDIO_RESPONSE_ERROR');
    }
    throw new AudioGenerationError('Failed to create audio response', 'AUDIO_RESPONSE_ERROR');
  }
}

// Main service function
export async function generateAudio(payload: GenerateAudioPayload): Promise<GenerateAudioResponse> {
  if (!payload.avatar) {
    throw new AudioGenerationError("No avatar provided for audio generation", 'NO_AVATAR');
  }

  if (!payload.dialog?.trim()) {
    throw new AudioGenerationError("No dialog text provided", 'NO_DIALOG');
  }

  try {
    // Get training audio
    const trainingAudio = await getTrainingAudioForSource(
      payload.avatar,
      payload.audioSource || 'avatar'
    );

    if (!trainingAudio) {
      throw new TrainingAudioError("No training audio available");
    }

    // Encode audio
    const { base64: audioBase64 } = await encodeAudioFile(trainingAudio, '/test/training_audio/');

    // Create and start task
    const requestData = createTaskRequest(payload, audioBase64);
    const taskId = await startAudioGenerationTask(requestData);

    // Poll for result
    const base64Audio = await pollTaskStatus(taskId);

    // Create response
    return createAudioResponse(base64Audio, taskId);
  } catch (error) {
    // Handle base64 errors specifically
    if (error instanceof Base64EncodingError) {
      throw new TrainingAudioError(`Audio encoding failed: ${error.message}`);
    }
    if (error instanceof Base64DecodingError) {
      throw new AudioGenerationError(`Audio decoding failed: ${error.message}`, 'DECODE_ERROR');
    }
    if (error instanceof AudioGenerationError) throw error;
    throw new AudioGenerationError(
      `Audio generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'GENERATION_FAILED'
    );
  }
}