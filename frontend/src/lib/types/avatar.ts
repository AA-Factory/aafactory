// types/avatar.ts
import { z } from 'zod';
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
export const createAvatarFormSchema = (isEdit: boolean) => {
  let image = isEdit ? z
    .instanceof(File, { message: 'Please select an image file' })
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'File size must be less than 5MB',
    )
    .refine(
      (file) =>
        ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
          file.type,
        ),
      'File must be a JPEG, PNG, or WebP image',
    )
    .optional() : z
      .instanceof(File, { message: 'Please select an image file' })
      .refine(
        (file) => file.size <= 5 * 1024 * 1024,
        'File size must be less than 5MB',
      )
      .refine(
        (file) =>
          ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
            file.type,
          ),
        'File must be a JPEG, PNG, or WebP image',
      );

  return z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be at most 50 characters'),
    personality: z
      .string()
      .min(10, 'Personality must be at least 10 characters')
      .max(1000, 'Personality must be at most 1000 characters'),
    backgroundKnowledge: z
      .string()
      .min(10, 'Background knowledge must be at least 10 characters')
      .max(2000, 'Background knowledge must be at most 2000 characters'),
    description: z
      .string()
      .max(200, 'Description must be at most 200 characters')
      .optional()
      .or(z.literal('')),
    category: z
      .enum(['realistic', 'stylized', 'cartoon', 'fantasy'], {
        errorMap: () => ({ message: 'Please select a valid category' }),
      })
      .optional(),
    image: image,
    trainingAudio: z
      .instanceof(File, { message: 'Please select an audio file' })
      .refine(
        (file) => file.size <= 10 * 1024 * 1024,
        'File size must be less than 10MB',
      )
      .refine(
        (file) => ['audio/mpeg', 'audio/wav', 'audio/x-wav'].includes(file.type),
        'File must be an MP3 or WAV audio',
      )
      .optional(),
  });
};
export type AvatarFormData = z.infer<ReturnType<typeof createAvatarFormSchema>>;