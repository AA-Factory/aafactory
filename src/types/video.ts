export type JobStatus = 'COMPLETED' | 'IN_QUEUE' | 'IN_PROGRESS' | 'FAILED' | 'CANCELLED';

export type GenerateImagePayload = {
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

export type GenerateImageOutPayload = {
  input: {
    workflow: Record<string, unknown>;
  };
};

export type GenerateImage = {
  /** filename */
  name: string;
  /** Base 64 encoded image */
  image: string;
};

export type BaseResponse = {
  id: string;
  status: JobStatus;
  error?: string;
  workerId?: string;
};

export type GenerateResponse = BaseResponse & {
  delayTime: number;
  executionTime: number;
  output: {
    /** The base64 encoded generated image */
    message: string;
    status: 'success' | 'error';
  };
};

export type StatusResponse = BaseResponse & {
  delayTime: number;
  executionTime: number;
  output?: {
    /** The base64 encoded generated image */
    message: string;
    status: 'success' | 'error';
  };
};

export type ImageQueryResult = {
  data: ({ uploadUrl: string } & (BaseResponse | GenerateResponse | StatusResponse)) | null;
  error: unknown;
};