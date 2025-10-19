// types/avatar.ts
import type { FieldError, FieldValues, Path, UseFormRegister } from 'react-hook-form';
import { z } from 'zod';

// File validation types
export interface FileConstraints {
  maxSize: number;
  allowedTypes: string[];
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// Form field types
export interface FormFieldProps<T extends FieldValues = FieldValues> {
  name: Path<T>;
  label: string;
  type?: 'text' | 'textarea' | 'select';
  rows?: number;
  placeholder?: string;
  register: UseFormRegister<T>;
  error?: FieldError;
  options?: ReadonlyArray<{ label: string; value: string }>;
  hidden?: boolean;
  required?: boolean;
  showError?: boolean;
}

// Upload states
export type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export interface FileUploadState {
  image: UploadState;
  audio: UploadState;
}

// Form state
export interface AvatarFormState {
  expandedSections: Record<string, boolean>;
  files: {
    image: string | null;
    audio: File | null;
  };
  uploadStates: FileUploadState;
}

export interface Avatar {
  id: string;
  name: string;
  personality: string;
  backgroundKnowledge: string;
  description?: string;
  category?: 'realistic' | 'stylized' | 'cartoon' | 'fantasy';
  hasEncodedData?: boolean;
  src?: string;
  fileName?: string;
  trainingAudioPath?: string;
  trainingAudioFileName?: string;
  createdAt: string;
  updatedAt: string;
}

// Check if File is available (browser environment)
const isClient = typeof window !== 'undefined';

export const createAvatarFormSchema = (isEdit: boolean) => {
  // Use z.any() for SSR, z.instanceof(File) for client
  const fileSchema = isClient
    ? z.instanceof(File, { message: 'Please select an image file' })
    : z.any();

  let image = isEdit
    ? fileSchema
      .refine(
        (file) => !isClient || file.size <= 5 * 1024 * 1024,
        'File size must be less than 5MB',
      )
      .refine(
        (file) =>
          !isClient || ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
            file.type,
          ),
        'File must be a JPEG, PNG, or WebP image',
      )
      .optional()
    : fileSchema
      .refine(
        (file) => !isClient || file.size <= 5 * 1024 * 1024,
        'File size must be less than 5MB',
      )
      .refine(
        (file) =>
          !isClient || ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
            file.type,
          ),
        'File must be a JPEG, PNG, or WebP image',
      );

  const audioFileSchema = isClient
    ? z.instanceof(File, { message: 'Please select an audio file' })
    : z.any();

  return z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be at most 50 characters'),
    personality: z
      .string()
      .min(10, 'Personality must be at least 10 characters')
      .max(1000, 'Personality must be at most 1000 characters')
      .optional(),
    backgroundKnowledge: z
      .string()
      .min(10, 'Background knowledge must be at least 10 characters')
      .max(2000, 'Background knowledge must be at most 2000 characters')
      .optional(),
    description: z
      .string()
      .max(200, 'Description must be at most 200 characters')
      .optional()
      .or(z.literal('')),
    category: z
      .enum(['realistic', 'stylized', 'cartoon', 'fantasy'])
      .optional(),
    image: image,
    trainingAudio: audioFileSchema
      .refine(
        (file) => !isClient || file.size <= 10 * 1024 * 1024,
        'File size must be less than 10MB',
      )
      .refine(
        (file) => !isClient || ['audio/mpeg', 'audio/wav', 'audio/x-wav'].includes(file.type),
        'File must be an MP3 or WAV audio',
      )
      .optional(),
  });
};
export type AvatarFormData = z.infer<ReturnType<typeof createAvatarFormSchema>>;
