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

// Avatar validation schema using Zod (modern approach)
export const avatarFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be no more than 50 characters')
    .regex(
      /^[a-zA-Z0-9_\s-]+$/,
      'Name must contain only letters, numbers, underscores, spaces, and hyphens',
    ),

  description: z
    .string()
    .min(5, 'Description must be at least 5 characters')
    .max(200, 'Description must be no more than 200 characters')
    .optional(),

  category: z
    .enum(['realistic', 'stylized', 'cartoon', 'fantasy'], {
      message: 'Please select a valid category',
    })
    .optional(),

  personality: z
    .string()
    .min(10, 'Personality must be at least 10 characters')
    .max(500, 'Personality must be no more than 500 characters')
    .optional(),

  backgroundKnowledge: z
    .string()
    .min(10, 'Background knowledge must be at least 10 characters')
    .max(1000, 'Background knowledge must be no more than 1000 characters')
    .optional(),

  image: z
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
    .optional(),

  trainingAudio: z
    .instanceof(File, { message: 'Please select an audio file' })
    .refine(
      (file) => file.size <= 50 * 1024 * 1024,
      'Audio file size must be less than 50MB',
    )
    .refine(
      (file) =>
        [
          'audio/mp3',
          'audio/wav',
          'audio/m4a',
          'audio/mpeg',
          'audio/ogg',
        ].includes(file.type),
      'File must be an MP3, WAV, M4A, or OGG audio file',
    )
    .optional(),
});

export type AvatarFormData = z.infer<typeof avatarFormSchema>;
