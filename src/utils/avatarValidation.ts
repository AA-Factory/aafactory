import { z } from 'zod';

export const avatarFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be no more than 50 characters')
    .regex(
      /^[a-zA-Z0-9_\s-]+$/,
      'Name must contain only letters, numbers, underscores, spaces, and hyphens'
    ),
  
  description: z
    .string()
    .min(5, 'Description must be at least 5 characters')
    .max(200, 'Description must be no more than 200 characters')
    .optional(),
  
  category: z.enum(['realistic', 'stylized', 'cartoon', 'fantasy'], {
    message: 'Please select a valid category',
  }).optional(),
  
  personality: z
    .string()
    .min(10, 'Personality must be at least 10 characters')
    .max(500, 'Personality must be no more than 500 characters'),
  
  backgroundKnowledge: z
    .string()
    .min(10, 'Background knowledge must be at least 10 characters')
    .max(1000, 'Background knowledge must be no more than 1000 characters'),
  
  voiceModel: z.enum(['elevenlabs', 'openai', 'azure', 'google'], {
    message: 'Please select a valid voice model',
  }),
  
  image: z
    .instanceof(File, { message: 'Please select an image file' })
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'File size must be less than 5MB'
    )
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      'File must be a JPEG, PNG, or WebP image'
    )
    .optional(),
});

export type AvatarFormData = z.infer<typeof avatarFormSchema>;

export const voiceModelOptions = [
  { value: 'elevenlabs', label: 'ElevenLabs' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'azure', label: 'Azure' },
  { value: 'google', label: 'Google' },
] as const;

export const categoryOptions = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'stylized', label: 'Stylized' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'fantasy', label: 'Fantasy' },
] as const;