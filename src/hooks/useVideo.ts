// hooks/useVideo.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/utils/api-client';

export const COMFYUI_BASE_URL = 'http://localhost:8000';
export const COMFYUI_RUN_ASYNC = `${COMFYUI_BASE_URL}/run`
export const COMFYUI_RUN_SYNC = `${COMFYUI_BASE_URL}/runsync`;
export const COMFYUI_STATUS = `${COMFYUI_BASE_URL}/status`;
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
// Then parse it when you need to use it:
// const config = JSON.parse(workflowConfigJSON);
export type GenerateImagePayload = {
  // images: File[];
  mode: 'single' | 'dual';
  email: string;
  person1: File;
  person1Gender: 'male' | 'female';
  reference: File;
  pose: File;
  hasSharingConsent: boolean;
  person2?: File | null;
  person2Gender?: 'male' | 'female';
  filenamePrefix?: string;
  async?: boolean;
  positivePrompt1: string | null | undefined;
  positivePrompt2: string | null | undefined;
  negativePrompt: string | null | undefined;
  watermarkUrl?: string | null;
};

type GenerateImageOutPayload = {
  input: {
    workflow: Record<string, unknown>;
    // images: GenerateImage[];
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
};

export type GenerateResponse = BaseResponse & {
  delayTime: number;
  executionTime: number;

  output: {
    /**
     * The base64 encode generated image
     */
    message: string;
    status: 'success' | 'error';
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
    status: 'success' | 'error';
  };
};

export type ImageQueryResult = {
  data: ({ uploadUrl: string } & (BaseResponse | GenerateResponse | StatusResponse)) | null;
  error: unknown;
};

type JobStatus = 'COMPLETED' | 'IN_QUEUE' | 'IN_PROGRESS' | 'FAILED' | 'CANCELLED';


export function useGenerateImage() {
  const queryClient = useQueryClient();
  // const { setPersistedState } = useLocalStorageContext();

  return useMutation({
    mutationFn: async (payload: GenerateImagePayload = {}) => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      // headers.append('Authorization', `Bearer ${RUNPOD_TOKEN}`);

      // const files = [payload.person1, payload.person2, payload.reference, payload.pose].filter(
      //   (img): img is NonNullable<typeof img> => Boolean(img),
      // );

      // const images: GenerateImage[] = await Promise.all(
      //   files.map(async (image) => ({
      //     name: image.name,
      //     image: await fileToBase64(image),
      //   })),
      // );

      const workflow = workflowObject;

      const outPayload: GenerateImageOutPayload = {
        input: {
          workflow: workflow.prompt
          // images,
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
          throw new Error('Request failed: ' + res.status);
        }

        let json = (await res.json()) as BaseResponse | GenerateResponse;
        console.log('✌️json --->', json);

        if (json.error) {
          throw new Error(json.error);
        }

        // const pendingGeneration: PendingGeneration = {
        //   jobId: json.id,
        //   email: payload.email,
        //   reference: payload.reference.name,
        //   pose: payload.pose.name,
        //   persons_count: payload.mode === 'single' ? 1 : 2,
        //   person1_gender: payload.person1Gender,
        //   person2_gender: payload.person2Gender,
        //   has_sharing_consent: payload.hasSharingConsent,
        //   filenamePrefix: payload.filenamePrefix ?? '',
        //   watermarkUrl: payload.watermarkUrl,
        // };

        // if (payload.async) {
        //   setPersistedState((state) => {
        //     return {
        //       ...state,
        //       pendingGeneration,
        //     };
        //   });
        //   json = await pollJobStatus(json.id, headers);
        // }

        if (json.status === 'COMPLETED' && 'output' in json && json.output.status === 'error') {
          const errorMessage = json.output.message.startsWith(
            'the image does not exist in the specified output folder',
          )
            ? 'An unknown error occured during the image generation'
            : json.output.message;

          throw new Error(errorMessage);
        }

        if (json.status !== 'COMPLETED') {
          throw new Error(`Image generation failed. Status: ${json.status} Error: ${json.error}`);
        }

        const imageString =
          'output' in json && json.output.status === 'success' ? json.output.message : '';

        // const brandedImage = payload.watermarkUrl
        //   ? await createSingleImageWithBranding(imageString, payload.watermarkUrl)
        //   : imageString;

        // const uploadUrl = brandedImage
        //   ? await uploadToSupabase(brandedImage, payload.email, payload.filenamePrefix)
        //   : `data:image/png;base64,${brandedImage}`;

        // await addGenerationEntry({
        //   ...removeKeys(pendingGeneration, ['jobId', 'filenamePrefix', 'watermarkUrl']),
        //   filename: uploadUrl.split('/').pop() ?? uploadUrl,
        // });

        return {
          data: {
            ...json,
            // uploadUrl,
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






// export function useVideo(videoUrl: string) {
//   return useQuery({
//     queryKey: ['video', videoUrl],
//     queryFn: async () => {
//       const response = await apiClient.get<{ data: any }>(`/video?url=${encodeURIComponent(videoUrl)}`)
//       return response.data
//     },
//     staleTime: 1000 * 60 * 5, // 5 minutes
//     retry: 3, // Retry failed requests up to 3 times
//     refetchOnWindowFocus: false,
//     refetchOnReconnect: false,
//     enabled: !!videoUrl, // Only run the query if videoUrl is provided
//   })
// }