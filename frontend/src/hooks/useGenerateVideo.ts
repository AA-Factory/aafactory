import { useMutation } from "@tanstack/react-query";
import { buildWorkflow } from "../utils/workflow";
import {
  COMFYUI_RUN_ASYNC,
  COMFYUI_RUN_SYNC,
  COMFYUI_SERVER_URL,
  COMFYUI_STATUS,
} from "@/config/constants";
import { Avatar } from "@/types/avatar";

export type GenerateVideoPayload = {
  audioFilename: string; // Generated audio filename from useGenerateAudio
  avatar: Avatar | null; // Avatar object containing voice model and image
  async?: boolean;
};

export type GenerateVideoResponse = {
  videoUrl: string;
  filename: string;
  promptId: string;
};

type GenerateVideoOutPayload = {
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

// Encode audio file from ComfyUI server
async function encodeAudioFromServer(filename: string): Promise<string> {
  const audioResponse = await fetch(
    `${COMFYUI_SERVER_URL}/api/view?filename=${filename}`,
  );
  if (!audioResponse.ok) {
    throw new Error(`Failed to load audio file: ${filename}`);
  }

  const audioBlob = await audioResponse.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data:audio/flac;base64, prefix (or whatever format)
      const base64Data = base64String.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = () => reject(new Error("Failed to encode audio file"));
    reader.readAsDataURL(audioBlob);
  });
}

// Encode image from URL
async function encodeImageFromUrl(imageUrl: string): Promise<string> {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to load image: ${imageUrl}`);
  }

  const imageBlob = await imageResponse.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data:image/jpeg;base64, prefix (or whatever format)
      const base64Data = base64String.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = () => reject(new Error("Failed to encode image file"));
    reader.readAsDataURL(imageBlob);
  });
}

// Extract video filename from history data
function extractVideoFilename(
  historyData: any,
  promptId: string,
): string | null {
  const outputs = historyData[promptId]?.outputs;
  if (!outputs) return null;

  let filename = null;
  Object.keys(outputs).forEach((nodeId) => {
    const nodeOutput = outputs[nodeId];
    // Look for video files (common extensions)
    if (nodeOutput.videos && nodeOutput.videos[0]?.filename) {
      filename = nodeOutput.videos[0].filename;
    } else if (nodeOutput.gifs && nodeOutput.gifs[0]?.filename) {
      filename = nodeOutput.gifs[0].filename;
    }
  });

  return filename;
}

async function pollJobStatus(
  jobId: string,
  interval = 1000,
  maxAttempts = 30,
): Promise<GenerateResponse> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const res = await fetch(`${COMFYUI_STATUS}/${jobId}`, {
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch job status: ${res.status}`);
    }
    const json = (await res.json()) as GenerateResponse;
    console.log("✌️ json --->", json);

    if (json.status === "COMPLETED") {
      return json;
    }
    if (json.status === "FAILED" || json.status === "CANCELLED") {
      throw new Error(`Job ${jobId} failed or cancelled: ${json.error}`);
    }

    // wait before polling again
    await new Promise((resolve) => setTimeout(resolve, interval));
    attempts++;
  }

  throw new Error("Job polling timed out");
}

export function useGenerateVideo() {
  return useMutation({
    mutationFn: async (
      payload: GenerateVideoPayload,
    ): Promise<GenerateVideoResponse> => {
      try {

        // Encode audio file from ComfyUI server
        const audioBase64 = await encodeAudioFromServer(payload.audioFilename);

        // Encode avatar image from local file
        console.log('✌️payload.avatar --->', payload.avatar);
        if (!payload.avatar?.src) {
          throw new Error("Avatar image source is missing.");
        }
        const imageBase64 = await encodeImageFromUrl(payload.avatar.src);
        const imageFilename = payload.avatar?.fileName;
        console.log("✌️imageFilename --->", imageFilename);

        // Import and build workflow
        const baseWorkflow = await import(
          "@/config/workflows/audio_image_to_video_with_sonic.json"
        );
        const workflow = buildWorkflow(baseWorkflow.default || baseWorkflow, {
          // These node IDs will need to be updated based on your actual workflow
          9: { inputs: { audio: payload.audioFilename } }, // Audio input node
          7: { inputs: { image: imageFilename } }, // Image input node
        });

        const outPayload: GenerateVideoOutPayload = {
          input: {
            workflow,
            images: [
              {
                name: payload.audioFilename,
                image: audioBase64,
              },
              {
                name: imageFilename,
                image: imageBase64,
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

        let promptId: string;

        if (payload.async && json.status !== "COMPLETED") {
          // async flow → poll until it's completed
          const result = await pollJobStatus(json.id);
          promptId = result.output?.prompt_id || result.id;
        } else {
          // sync flow
          if (json.status !== "COMPLETED") {
            throw new Error(`Video generation failed. Status: ${json.status}`);
          }
          promptId =
            "output" in json && json.output.prompt_id
              ? json.output.prompt_id
              : json.id;
        }

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

        // Extract video filename
        const filename = extractVideoFilename(historyData, promptId);

        if (!filename) {
          throw new Error("No video file generated");
        }

        const videoUrl = `${COMFYUI_SERVER_URL}/api/view?filename=${filename}`;
        console.log("Generated video filename:", filename);

        return {
          videoUrl,
          filename,
          promptId,
        };
      } catch (error) {
        console.error("Video generation error:", error);
        throw error;
      }
    },
  });
}
