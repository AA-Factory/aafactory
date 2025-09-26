import { useMutation } from "@tanstack/react-query";
import { buildWorkflow } from "@/lib/workflow";
import {
  COMFYUI_RUN_ASYNC,
  COMFYUI_RUN_SYNC,
  COMFYUI_SERVER_URL,
  COMFYUI_STATUS,
} from "@/config/constants";

export type GenerateImagePayload = {
  workflow: Record<string, unknown>;
  workflowOverrides?: Record<string, { inputs?: Record<string, any> }>;
  images?: GenerateImage[];
  async?: boolean;
};

type GenerateImageOutPayload = {
  input: {
    workflow: Record<string, unknown>;
    images: GenerateImage[];
  };
};

type GenerateImage = {
  /**
   * filename
   */
  name: string;

  /**
   * Base 64 encoded image
   */
  image: string;
};

type BaseResponse = {
  id: string;
  status: JobStatus;
  error?: string;
  workerId?: string;
  prompt_id?: string;
};

export type GenerateResponse = BaseResponse & {
  delayTime: number;
  executionTime: number;

  output: {
    /**
     * The base64 encode generated image
     */
    message: string;
    status: "success" | "error";
    prompt_id?: string;
  };
};

export type StatusResponse = BaseResponse & {
  delayTime: number;
  executionTime: number;
  output?: {
    /**
     * The base64 encode generated image
     */
    message: string;
    status: "success" | "error";
  };
};

export type ImageQueryResult = {
  data:
    | ({ uploadUrl: string } & (
        | BaseResponse
        | GenerateResponse
        | StatusResponse
      ))
    | null;
  error: unknown;
};

type JobStatus =
  | "COMPLETED"
  | "IN_QUEUE"
  | "IN_PROGRESS"
  | "FAILED"
  | "CANCELLED";

export function useGenerateImage() {
  return useMutation({
    mutationFn: async (payload: GenerateImagePayload) => {
      const headers = new Headers();
      headers.append("Content-Type", "application/json");

      // Extract the actual workflow from the import (handle both direct and default exports)
      const baseWorkflow = payload.workflow.default || payload.workflow;

      // Use buildWorkflow if workflowOverrides are provided, otherwise use the workflow directly
      let finalWorkflow;
      if (
        payload.workflowOverrides &&
        Object.keys(payload.workflowOverrides).length > 0
      ) {
        finalWorkflow = buildWorkflow(baseWorkflow, payload.workflowOverrides);
      } else {
        finalWorkflow = baseWorkflow;
      }

      const outPayload: GenerateImageOutPayload = {
        input: {
          workflow: finalWorkflow,
          images: payload.images || [],
        },
      };

      const url = payload.async ? COMFYUI_RUN_ASYNC : COMFYUI_RUN_SYNC;

      try {
        const res = await fetch(url, {
          headers,
          method: "POST",
          body: JSON.stringify(outPayload),
        });

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const json = (await res.json()) as BaseResponse | GenerateResponse;
        console.log("Generate image response:", json);

        if (json.error) {
          throw new Error(json.error);
        }

        if (
          json.status === "COMPLETED" &&
          "output" in json &&
          json.output.status === "error"
        ) {
          const errorMessage = json.output.message.startsWith(
            "the image does not exist in the specified output folder",
          )
            ? "An unknown error occurred during the image generation"
            : json.output.message;

          throw new Error(errorMessage);
        }

        if (json.status !== "COMPLETED") {
          throw new Error(
            `Image generation failed. Status: ${json.status} Error: ${json.error}`,
          );
        }

        const imageString =
          "output" in json && json.output.status === "success"
            ? json.output.message
            : "";

        return {
          data: {
            ...json,
            imageString,
          },
          error: null,
        };
      } catch (err) {
        return {
          data: null,
          error: err,
        };
      }
    },

    onSuccess(_data, _variables) {
      // Handle success if needed
    },
  });
}
