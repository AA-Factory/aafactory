import { useMutation } from "@tanstack/react-query";
import { buildWorkflow } from "../utils/workflow";
import {
  COMFYUI_RUN_ASYNC,
  COMFYUI_RUN_SYNC,
  COMFYUI_SERVER_URL,
  COMFYUI_STATUS
} from "@/config/constants";
import { Avatar } from "@/types/avatar";

export type GenerateAudioPayload = {
  dialog: string;
  avatar: Avatar | null;
  async?: boolean;
};

export type GenerateAudioResponse = {
  audioUrl: string;
  filename: string;
  promptId: string;
  base64Audio?: string;
};

type GenerateAudioOutPayload = {
  input: {
    workflow: Record<string, unknown>;
    files: { name: string; audio: string }[];
  };
};

type JobStatus =
  | "COMPLETED"
  | "IN_QUEUE"
  | "IN_PROGRESS"
  | "FAILED"
  | "CANCELLED";

type BaseResponse = {
  id: string;
  status: JobStatus;
  error?: string;
  workerId?: string;
};

export type GenerateResponse = BaseResponse & {
  delayTime: number;
  executionTime: number;

  output: {
    message: string;
    status: "success" | "error";
    prompt_id?: string;
  };
};

// Convert base64 string to blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  console.log('✌️base64 --->', base64);
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// Extract audio file encoding to separate function
async function encodeAudioFile(
  audioTrainingFile: string | File,
): Promise<{ base64: string; filename: string }> {
  let audioBlob: Blob;
  let filename: string;

  if (audioTrainingFile instanceof File) {
    // Handle uploaded file
    audioBlob = audioTrainingFile;
    filename = audioTrainingFile.name;
  } else {
    // Handle file path (existing functionality)
    const audioResponse = await fetch(
      `/test/training_audio/${audioTrainingFile}`,
    );

    if (!audioResponse.ok) {
      throw new Error(`Failed to load audio file: ${audioTrainingFile}`);
    }
    audioBlob = await audioResponse.blob();
    filename = audioTrainingFile;
  }

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      resolve(base64Data);
    };
    reader.onerror = () => reject(new Error("Failed to encode audio file"));
    reader.readAsDataURL(audioBlob);
  });

  return { base64, filename };
}

// Poll job status until completion
async function pollJobStatus(jobId: string): Promise<GenerateResponse> {
  const maxAttempts = 60; // 5 minutes with 5 second intervals
  const pollInterval = 5000; // 5 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const statusResponse = await fetch(`${COMFYUI_STATUS}/${jobId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `${process.env.NEXT_PUBLIC_RUNPOD_API_KEY}`
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }

      const statusData = (await statusResponse.json()) as GenerateResponse;

      if (statusData.status === "COMPLETED") {
        return statusData;
      }

      if (statusData.status === "FAILED" || statusData.status === "CANCELLED") {
        throw new Error(
          `Job ${statusData.status.toLowerCase()}. ${statusData.error || ""}`
        );
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw new Error(`Polling failed after ${maxAttempts} attempts: ${error}`);
      }
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error(`Job polling timed out after ${maxAttempts * pollInterval / 1000} seconds`);
}

// Extract audio filename from history data
function extractAudioFilename(
  historyData: any,
  promptId: string,
): string | null {
  const outputs = historyData[promptId]?.outputs;
  if (!outputs) return null;

  let filename = null;
  Object.keys(outputs).forEach((nodeId) => {
    const nodeOutput = outputs[nodeId];
    if (nodeOutput.audio && nodeOutput.audio[0]?.filename) {
      filename = nodeOutput.audio[0].filename;
    }
  });

  return filename;
}

export function useGenerateAudio() {
  return useMutation({
    mutationFn: async (
      payload: GenerateAudioPayload,
    ): Promise<GenerateAudioResponse> => {
      try {
        if (!payload.avatar?.voiceTrainingData) {
          throw new Error("No voice training data provided for the avatar.");
        }
        const { base64: audioBase64, filename: audioFilename } =
          await encodeAudioFile(payload.avatar.voiceTrainingData);

        // Import and build workflow
        const baseWorkflow = await import(
          "@/config/workflows/text_to_speech_with_zonos.json"
        );
        const workflow = buildWorkflow(baseWorkflow.default || baseWorkflow, {
          12: { inputs: { audio: audioFilename } },
          24: {
            inputs: {
              speech: payload.dialog,
            },
          },
        });

        const outPayload: GenerateAudioOutPayload = {
          input: {
            workflow,
            files: [
              {
                name: audioFilename,
                audio: audioBase64,
              },
            ],
          },
        };

        // Make the request to ComfyUI
        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        //add authorization header if using runpod
        headers.append("Authorization", `${process.env.NEXT_PUBLIC_RUNPOD_API_KEY}`);

        const url = payload.async ? COMFYUI_RUN_ASYNC : COMFYUI_RUN_SYNC;

        const res = await fetch(url, {
          headers,
          method: "POST",
          body: JSON.stringify(outPayload),
        });

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const json = (await res.json()) as BaseResponse | GenerateResponse;

        if (json.error) {
          throw new Error(json.error);
        }

        // Handle async requests by polling status endpoint
        let finalResponse = json;
        if (payload.async && json.status !== "COMPLETED") {
          finalResponse = await pollJobStatus(json.id);
        } else if (json.status !== "COMPLETED") {
          throw new Error(
            `Audio generation failed. Status: ${json.status} Error: ${json.error}`,
          );
        }

        // Extract prompt_id
        const promptId =
          "output" in finalResponse && finalResponse.output.prompt_id
            ? finalResponse.output.prompt_id
            : finalResponse.id;

        if (!promptId) {
          throw new Error("No prompt ID returned from generation");
        }

        // Check if response has base64 audio in message field
        let audioUrl: string;
        let filename: string;
        let base64Audio: string = "";
        if ("output" in finalResponse && finalResponse.output.message) {
          // Handle base64 audio from message field
          base64Audio = finalResponse.output.message;

          // Convert base64 to blob URL
          const audioBlob = base64ToBlob(base64Audio, 'audio/wav');
          audioUrl = URL.createObjectURL(audioBlob);
          filename = `generated_audio_${Date.now()}.wav`;

          console.log("Using base64 audio from message field");
        } else {
          // Fallback to original history-based approach
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const historyResponse = await fetch(
            `${COMFYUI_SERVER_URL}/history/${promptId}`,
            {
              mode: "cors",
              headers: {
                "Content-Type": "application/json",
              },
            },
          );

          if (!historyResponse.ok) {
            throw new Error(`Failed to fetch history: ${historyResponse.status}`);
          }

          const historyData = await historyResponse.json();

          // Extract audio filename
          const extractedFilename = extractAudioFilename(historyData, promptId);

          if (!extractedFilename) {
            throw new Error("No audio file generated");
          }

          filename = extractedFilename;

          audioUrl = `${COMFYUI_SERVER_URL}/api/view?filename=${filename}`;
          console.log("Generated audio filename:", filename);
        }

        return {
          base64Audio,
          audioUrl,
          filename,
          promptId,
        };
      } catch (error) {
        console.error("Audio generation error:", error);
        throw error;
      }
    },
  });
}
