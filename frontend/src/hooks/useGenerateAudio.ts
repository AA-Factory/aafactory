import { useMutation } from "@tanstack/react-query";
import { Avatar } from "@/types/avatar";
import {
  CELERY_RUN_TASK,
  CELERY_TASK_STATUS,
} from "@/config/constants";

// Constants
const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLING_ATTEMPTS = 60; // 5 minutes total
const DEFAULT_LANGUAGE = "en-us";

// Types
export type GenerateAudioPayload = {
  dialog: string;
  avatar: Avatar | null;
  language?: string;
  async?: boolean;
};

export type GenerateAudioResponse = {
  audioUrl: string;
  filename: string;
  promptId: string;
  base64Audio: string;
};

type CeleryTaskRequest = {
  server_name: string;
  task_name: string;
  payload: {
    text: string;
    voice_sample: string;
    language: string;
  };
};

type CeleryTaskResponse = {
  task_id: string;
  status: string;
};

type CeleryTaskStatus = {
  status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'RETRY';
  result?: string;
};

// Utility functions
function cleanBase64(base64String: string): string {
  let cleaned = base64String.replace(/[^A-Za-z0-9+/=]/g, '');

  while (cleaned.length % 4) {
    cleaned += '=';
  }

  return cleaned;
}

function base64ToBlob(base64Audio: string): Blob {
  const cleanedBase64 = cleanBase64(base64Audio);

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanedBase64)) {
    throw new Error('Invalid base64 string format');
  }

  const binaryString = atob(cleanedBase64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: 'audio/wav' });
}

async function encodeAudioFile(
  audioTrainingFile: string | File,
): Promise<{ base64: string; filename: string }> {
  let audioBlob: Blob;
  let filename: string;

  if (audioTrainingFile instanceof File) {
    audioBlob = audioTrainingFile;
    filename = audioTrainingFile.name;
  } else {
    const audioResponse = await fetch(`/test/training_audio/${audioTrainingFile}`);

    if (!audioResponse.ok) {
      throw new Error(`Failed to load audio file: ${audioTrainingFile}`);
    }

    audioBlob = await audioResponse.blob();
    filename = audioTrainingFile;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(',')[1];
      resolve({ base64: base64Data, filename });
    };
    reader.onerror = () => reject(new Error("Failed to encode audio file"));
    reader.readAsDataURL(audioBlob);
  });
}

async function pollJobStatus(requestData: CeleryTaskRequest): Promise<string> {
  const response = await fetch(CELERY_RUN_TASK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const result: CeleryTaskResponse = await response.json();

  if (!result.task_id || result.status !== 'PENDING') {
    throw new Error('Failed to start task: Invalid response');
  }

  return result.task_id;
}

async function pollTaskStatus(taskId: string): Promise<string> {
  let attempts = 0;

  while (attempts < MAX_POLLING_ATTEMPTS) {
    const statusResponse = await fetch(`${CELERY_TASK_STATUS}${taskId}`);

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status}`);
    }

    const taskResult: CeleryTaskStatus = await statusResponse.json();

    if (taskResult.status === 'SUCCESS') {
      if (!taskResult.result) {
        throw new Error('No result returned from task');
      }
      return taskResult.result;
    }

    if (taskResult.status === 'FAILURE') {
      throw new Error(taskResult.result || 'Task failed');
    }

    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    attempts++;
  }

  throw new Error('Task timeout: Audio generation took too long');
}

function createTaskRequest(payload: GenerateAudioPayload, audioBase64: string): CeleryTaskRequest {
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

function createAudioResponse(base64Audio: string, taskId: string): GenerateAudioResponse {
  const audioBlob = base64ToBlob(base64Audio.message);
  const audioUrl = URL.createObjectURL(audioBlob);
  const filename = `generated_audio_${Date.now()}.wav`;

  return {
    base64Audio,
    audioUrl,
    filename,
    promptId: taskId,
  };
}

export function useGenerateAudio() {
  return useMutation({
    mutationFn: async (payload: GenerateAudioPayload): Promise<GenerateAudioResponse> => {
      if (!payload.avatar?.voiceTrainingData) {
        throw new Error("No voice training data provided for the avatar.");
      }

      try {
        const { base64: audioBase64 } = await encodeAudioFile(payload.avatar.voiceTrainingData);
        const requestData = createTaskRequest(payload, audioBase64);
        const taskId = await pollJobStatus(requestData);
        const base64Audio = await pollTaskStatus(taskId);

        return createAudioResponse(base64Audio, taskId);
      } catch (error) {
        console.error("Audio generation error:", error);
        throw error;
      }
    },
  });
}