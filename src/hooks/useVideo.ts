import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  GenerateImagePayload,
  GenerateImageOutPayload,
  BaseResponse,
  GenerateResponse,
} from '@/types/video';

// API Endpoints
export const COMFYUI_BASE_URL = 'http://localhost:8000';
export const COMFYUI_RUN_ASYNC = `${COMFYUI_BASE_URL}/run`;
export const COMFYUI_RUN_SYNC = `${COMFYUI_BASE_URL}/runsync`;
export const COMFYUI_STATUS = `${COMFYUI_BASE_URL}/status`;

// ComfyUI Workflow Configuration
export const workflowObject = {
  "prompt": {
    "3": {
      "inputs": {
        "seed": 1337,
        "steps": 20,
        "cfg": 8,
        "sampler_name": "euler",
        "scheduler": "normal",
        "denoise": 1,
        "model": [
          "4",
          0
        ],
        "positive": [
          "6",
          0
        ],
        "negative": [
          "7",
          0
        ],
        "latent_image": [
          "5",
          0
        ]
      },
      "class_type": "KSampler"
    },
    "4": {
      "inputs": {
        "ckpt_name": "v1-5-pruned-emaonly.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "5": {
      "inputs": {
        "width": 512,
        "height": 512,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage"
    },
    "6": {
      "inputs": {
        "text": "beautiful scenery nature glass bottle landscape, purple galaxy bottle",
        "clip": [
          "4",
          1
        ]
      },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": {
        "text": "text, watermark",
        "clip": [
          "4",
          1
        ]
      },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": {
        "samples": [
          "3",
          0
        ],
        "vae": [
          "4",
          2
        ]
      },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": {
        "filename_prefix": "ComfyUI",
        "images": [
          "8",
          0
        ]
      },
      "class_type": "SaveImage"
    }
  }
};

export function useGenerateImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: GenerateImagePayload) => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');

      const outPayload: GenerateImageOutPayload = {
        input: {
          workflow: workflowObject.prompt
        },
      };

      const url = payload.async ? COMFYUI_RUN_ASYNC : COMFYUI_RUN_SYNC;

      try {
        const res = await fetch(url, {
          headers,
          method: 'POST',
          body: JSON.stringify(outPayload),
        });

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const json = (await res.json()) as BaseResponse | GenerateResponse;
        console.log('Generate image response:', json);

        if (json.error) {
          throw new Error(json.error);
        }

        if (json.status === 'COMPLETED' && 'output' in json && json.output.status === 'error') {
          const errorMessage = json.output.message.startsWith(
            'the image does not exist in the specified output folder',
          )
            ? 'An unknown error occurred during the image generation'
            : json.output.message;

          throw new Error(errorMessage);
        }

        if (json.status !== 'COMPLETED') {
          throw new Error(`Image generation failed. Status: ${json.status} Error: ${json.error}`);
        }

        const imageString =
          'output' in json && json.output.status === 'success' ? json.output.message : '';

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

    onSuccess(_data, variables) {
      void queryClient.invalidateQueries({
        queryKey: ['generated-images', { email: variables.email }],
      });
    },
  });
}