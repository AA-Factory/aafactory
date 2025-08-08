import {
  COMFYUI_RUN_ASYNC,
  COMFYUI_RUN_SYNC,
  COMFYUI_STATUS,
  RUNPOD_TOKEN,
} from '@/config/constants';
import dualWorflow from '@/config/workflow-dual.json';
import singleWorkflow from '@/config/workflow-single.json';
import { useLocalStorageContext } from '@/contexts/local-storage/useLocalStorageContext';
import { supabase } from '@/lib/db/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PendingGeneration } from '@/types';
import { createSingleImageWithBranding } from '@/utils/images';

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

export function useImages(email: string) {
  return useQuery({
    queryKey: ['generated-images', { email }],
    enabled: !!email,
    queryFn: async () => {
      const sanitizedEmail = sanitizeEmail(email);
      const userFolder = await supabase.storage.from('generated-images').list(sanitizedEmail);

      const images = (userFolder.data ?? []).map((image) => ({
        ...image,
        url: supabase.storage
          .from('generated-images')
          .getPublicUrl(`${sanitizedEmail}/${image.name}`, {
            transform: {
              width: 250,
              resize: 'contain',
              quality: 80,
            },
          }).data.publicUrl,
      }));

      return images;
    },
  });
}

export function useImageStatus(pendingGeneration: PendingGeneration | undefined) {
  return useQuery<ImageQueryResult>({
    queryKey: ['status', { id: pendingGeneration?.jobId }],
    enabled: !!pendingGeneration?.jobId,
    queryFn: async () => {
      if (!pendingGeneration?.jobId) return { data: null, error: new Error('No job id') };

      const headers = new Headers();
      headers.append('Accept', 'application/json');
      headers.append('Authorization', `Bearer ${RUNPOD_TOKEN}`);

      try {
        const json = await pollJobStatus(pendingGeneration.jobId, headers);

        if (
          json.status === 'COMPLETED' &&
          'output' in json &&
          json.output &&
          json.output.status === 'error'
        ) {
          const errorMessage = json.output.message.startsWith(
            'the image does not exist in the specified output folder',
          )
            ? 'An unknown error occured during the image generation'
            : json.output.message;

          throw new Error(errorMessage);
        }

        const imageString =
          'output' in json && json.output && json.output.status === 'success'
            ? json.output.message
            : '';

        const brandedImage = pendingGeneration.watermarkUrl
          ? await createSingleImageWithBranding(imageString, pendingGeneration.watermarkUrl)
          : imageString;

        const uploadUrl = brandedImage
          ? await uploadToSupabase(
              brandedImage,
              pendingGeneration.email,
              pendingGeneration.filenamePrefix,
            )
          : `data:image/png;base64,${brandedImage}`;

        await addGenerationEntry({
          ...removeKeys(pendingGeneration, ['jobId', 'filenamePrefix', 'watermarkUrl']),
          filename: uploadUrl.split('/').pop() ?? uploadUrl,
        });

        // setPersistedState((state) => ({ ...state, pendingGeneration: undefined }));

        return {
          data: {
            ...json,
            uploadUrl,
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
  });
}

export function useGenerateImage() {
  const queryClient = useQueryClient();
  const { setPersistedState } = useLocalStorageContext();

  return useMutation<ImageQueryResult, unknown, GenerateImagePayload>({
    mutationFn: async (payload: GenerateImagePayload) => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', `Bearer ${RUNPOD_TOKEN}`);

      const files = [payload.person1, payload.person2, payload.reference, payload.pose].filter(
        (img): img is NonNullable<typeof img> => Boolean(img),
      );

      const images: GenerateImage[] = await Promise.all(
        files.map(async (image) => ({
          name: image.name,
          image: await fileToBase64(image),
        })),
      );

      const workflow = prepareWorkflow(payload);

      const outPayload: GenerateImageOutPayload = {
        input: {
          workflow: workflow.prompt,
          images,
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

        if (json.error) {
          throw new Error(json.error);
        }

        const pendingGeneration: PendingGeneration = {
          jobId: json.id,
          email: payload.email,
          reference: payload.reference.name,
          pose: payload.pose.name,
          persons_count: payload.mode === 'single' ? 1 : 2,
          person1_gender: payload.person1Gender,
          person2_gender: payload.person2Gender,
          has_sharing_consent: payload.hasSharingConsent,
          filenamePrefix: payload.filenamePrefix ?? '',
          watermarkUrl: payload.watermarkUrl,
        };

        if (payload.async) {
          setPersistedState((state) => {
            return {
              ...state,
              pendingGeneration,
            };
          });
          json = await pollJobStatus(json.id, headers);
        }

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

        const brandedImage = payload.watermarkUrl
          ? await createSingleImageWithBranding(imageString, payload.watermarkUrl)
          : imageString;

        const uploadUrl = brandedImage
          ? await uploadToSupabase(brandedImage, payload.email, payload.filenamePrefix)
          : `data:image/png;base64,${brandedImage}`;

        await addGenerationEntry({
          ...removeKeys(pendingGeneration, ['jobId', 'filenamePrefix', 'watermarkUrl']),
          filename: uploadUrl.split('/').pop() ?? uploadUrl,
        });

        return {
          data: {
            ...json,
            uploadUrl,
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

function prepareWorkflow(payload: GenerateImagePayload) {
  const seed = getRandomInt(0, 2 ** 63 - 1);

  if (payload.mode === 'single') {
    const workflow = structuredClone(singleWorkflow);

    workflow.prompt[3].inputs.seed = seed;

    // Hard-code batch size to 1 in case we update the json file and forget to
    // set the correct value
    workflow.prompt[5].inputs.batch_size = 1;

    workflow.prompt[13].inputs.image = payload.person1.name;

    workflow.prompt[39].inputs.text = payload.positivePrompt1 || workflow.prompt['39'].inputs.text;
    workflow.prompt[40].inputs.text = payload.negativePrompt || workflow.prompt['40'].inputs.text;

    workflow.prompt[73].inputs.image = payload.reference.name;

    if (payload.pose) {
      workflow.prompt[77].inputs.image = payload.pose.name;
    } else {
      // Bypass the pose node if no pose reference file
      (workflow.prompt[77] as unknown as { mode: number }).mode = 4;
    }

    return workflow;
  }

  const workflow = structuredClone(dualWorflow);
  workflow.prompt[3].inputs.seed = seed;

  // Hard-code batch size to 1 in case we update the json file and forget to
  // set the correct value
  workflow.prompt[5].inputs.batch_size = 1;

  workflow.prompt[13].inputs.image = payload.person1.name;
  workflow.prompt[39].inputs.text = payload.positivePrompt1 || workflow.prompt['39'].inputs.text;

  workflow.prompt[68].inputs.image = payload.person2?.name ?? '';
  workflow.prompt[80].inputs.text = payload.positivePrompt2 || workflow.prompt['80'].inputs.text;

  workflow.prompt[69].inputs.image = payload.pose?.name ?? '';
  workflow.prompt[96].inputs.image = payload.reference.name;

  workflow.prompt[40].inputs.text = payload.negativePrompt || workflow.prompt['40'].inputs.text;

  return workflow;
}

async function pollJobStatus(id: string, headers: Headers) {
  if (!navigator.onLine) {
    // If offline, wait 5 seconds and retry
    await sleep(5000);
    return pollJobStatus(id, headers);
  }

  try {
    const res = await fetch(`${COMFYUI_STATUS}/${id}`, {
      headers,
    });

    if (!res.ok) {
      throw new Error('Request failed: ' + res.status);
    }

    const json = (await res.json()) as StatusResponse;

    if (json.status === 'FAILED') {
      throw new Error(json.error ?? 'Unknown error');
    }

    if (json.status === 'COMPLETED') {
      return json;
    }
  } catch (err) {
    // If the error is not a network error, throw it
    if (!(err instanceof Error) || !err.message.includes('Failed to fetch')) {
      throw err;
    }
  }

  // Retry after 5 seconds
  await sleep(5000);
  return pollJobStatus(id, headers);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadToSupabase(base64: string, email: string, prefix = '') {
  const file = base64ToFile(base64, generateFilenameFromDate('png', prefix));
  const sanitizedEmail = sanitizeEmail(email);
  const { error, data } = await supabase.storage
    .from('generated-images')
    .upload(`${sanitizedEmail}/${file.name}`, file, {
      contentType: 'image/png',
      cacheControl: String(60 * 60 * 24 * 30), // 30 days
    });

  if (error) {
    console.error(error);
  }

  return data?.path
    ? supabase.storage.from('generated-images').getPublicUrl(data.path).data.publicUrl
    : '';
}

type GenerationEntry = {
  email: string;
  reference: string;
  pose: string;
  persons_count: number;
  person1_gender: 'male' | 'female';
  person2_gender?: 'male' | 'female';
  has_sharing_consent: boolean;
  filename: string;
};

async function addGenerationEntry(payload: GenerationEntry) {
  const { data, error } = await supabase.from('generations').insert(payload);

  if (error) {
    console.error(error);
  }

  return data;
}

export function useDeleteImage(email: string, filename: string) {
  return useMutation({
    mutationFn: async () => {
      const sanitizedEmail = sanitizeEmail(email);
      const { data, error } = await supabase.storage
        .from('generated-images')
        .remove([`${sanitizedEmail}/${filename}`]);

      if (error) {
        console.error(error);
      }

      return data;
    },
  });
}

function fileToBase64(file: File) {
  const { promise, resolve, reject } = Promise.withResolvers<string>();

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    resolve((reader.result as string).split(',')[1]);
  };
  reader.onerror = () => reject(new Error('Error reading file'));

  return promise;
}

function base64ToFile(base64: string, name: string, mime = 'image/png') {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], name, { type: mime });
}

function generateFilenameFromDate(ext = 'png', prefix = '') {
  return prefix + new Date().toISOString().replace(/[:.]/g, '-') + '.' + ext;
}

export function fileNameToDate(fileName: string, prefix = '') {
  const regex = new RegExp(`^${prefix}`);
  fileName = fileName.replace(regex, '');
  const [date, _time] = fileName.split('T');
  const time = _time.replace('.png', '');
  const [hours, minutes, seconds, ms] = time.split('-');

  return new Date(`${date}T${hours}:${minutes}:${seconds}.${ms}`);
}

function sanitizeEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  const sanitizedLocalPart = localPart.split('+')[0];
  return `${sanitizedLocalPart}@${domain}`;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function removeKeys<TObject extends Record<string, unknown>, TKey extends keyof TObject>(
  obj: TObject,
  keys: TKey[],
) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as TKey)),
  ) as TObject;
}

/**
 * Notes:
 *
 * - Expected flow of the app (what is required, what is not, template, pose, etc)
 * - Should templates be specific to the number of individuals in the image?
 * - Do we need to specifiy the selected template for each image?
 * - Should it be possible to delete a image?
 * - How the credit system should work? Should regenerate, try other style, start fresh, takes credits?
 * - Do we need proper authentication? Magic links? OTP?
 * - Public storage folder RLS policies? Now, everything is public and everyone is allowed to do everything.
 * - Appearance male, female - where does it go?
 * - Should we create a table to define what the available templates are for each project?
 * - Should we create a table to store the generated image config (ref, pose, etc)?
 * - It auto deploy configured in Netlify, with PR previews?
 *
 *
 */
