import { useMutation } from "@tanstack/react-query";
import { buildWorkflow } from "../utils/workflow";
import {
  COMFYUI_RUN_ASYNC,
  COMFYUI_RUN_SYNC,
  COMFYUI_SERVER_URL,
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
};

type GenerateAudioOutPayload = {
  input: {
    workflow: Record<string, unknown>;
    images: { name: string; image: string }[];
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
      const base64String = reader.result as string;
      // Remove the data:audio/wav;base64, prefix
      const base64Data = base64String.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = () => reject(new Error("Failed to encode audio file"));
    reader.readAsDataURL(audioBlob);
  });

  return { base64, filename };
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
            images: [
              {
                name: audioFilename,
                image: audioBase64,
              },
            ],
          },
        };

        // Make the request to ComfyUI
        const headers = new Headers();
        headers.append("Content-Type", "application/json");
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

        if (json.status !== "COMPLETED") {
          throw new Error(
            `Audio generation failed. Status: ${json.status} Error: ${json.error}`,
          );
        }

        // Extract prompt_id
        const promptId =
          "output" in json && json.output.prompt_id
            ? json.output.prompt_id
            : json.id;

        if (!promptId) {
          throw new Error("No prompt ID returned from generation");
        }

        // Fetch history with delay
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
        const filename = extractAudioFilename(historyData, promptId);

        if (!filename) {
          throw new Error("No audio file generated");
        }

        const audioUrl = `${COMFYUI_SERVER_URL}/api/view?filename=${filename}`;
        console.log("Generated audio filename:", filename);

        return {
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
