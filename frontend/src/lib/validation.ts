import { z } from 'zod';

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
    .max(500, 'Personality must be no more than 500 characters'),

  backgroundKnowledge: z
    .string()
    .min(10, 'Background knowledge must be at least 10 characters')
    .max(1000, 'Background knowledge must be no more than 1000 characters'),

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

export const categoryOptions = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'stylized', label: 'Stylized' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'fantasy', label: 'Fantasy' },
] as const;

// Legacy validation schema (for backward compatibility)
export const avatarSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_\s-]+$/,
    message:
      'Name must be 2-50 characters, alphanumeric with underscores, spaces, and hyphens only',
  },
  personality: {
    required: true,
    minLength: 10,
    maxLength: 500,
    message: 'Personality must be 10-500 characters',
  },
  backgroundKnowledge: {
    required: true,
    minLength: 10,
    maxLength: 1000,
    message: 'Background knowledge must be 10-1000 characters',
  },
  voiceModel: {
    required: true,
    enum: ['elevenlabs', 'openai', 'azure', 'google'],
    message: 'Voice model must be one of: elevenlabs, openai, azure, google',
  },
};

// File validation schema
export const fileSchema = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
};

// Validate a single field (legacy function)
export function validateField(
  fieldName: string,
  value: any,
  schema = avatarSchema,
) {
  const rules = schema[fieldName as keyof typeof schema];
  if (!rules) return { isValid: true, error: null };

  const errors: string[] = [];

  // Required validation
  if (rules.required && (!value || value.toString().trim() === '')) {
    errors.push(`${fieldName} is required`);
  }

  // Skip other validations if field is empty and not required
  if (!value || value.toString().trim() === '') {
    return { isValid: errors.length === 0, error: errors[0] || null };
  }

  const stringValue = value.toString().trim();

  // Length validations
  if (
    'minLength' in rules &&
    rules.minLength &&
    stringValue.length < rules.minLength
  ) {
    errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
  }

  if (
    'maxLength' in rules &&
    rules.maxLength &&
    stringValue.length > rules.maxLength
  ) {
    errors.push(
      `${fieldName} must be no more than ${rules.maxLength} characters`,
    );
  }

  // Pattern validation
  if ('pattern' in rules && rules.pattern && !rules.pattern.test(stringValue)) {
    errors.push(rules.message || `${fieldName} format is invalid`);
  }

  // Enum validation
  if ('enum' in rules && rules.enum && !rules.enum.includes(stringValue)) {
    errors.push(
      rules.message || `${fieldName} must be one of: ${rules.enum.join(', ')}`,
    );
  }

  return {
    isValid: errors.length === 0,
    error: errors[0] || null,
  };
}

// Validate entire avatar object (legacy function)
export function validateAvatar(avatarData: any) {
  const errors: Record<string, string> = {};
  let isValid = true;

  // Validate each field
  Object.keys(avatarSchema).forEach((fieldName) => {
    const validation = validateField(fieldName, avatarData[fieldName]);
    if (!validation.isValid) {
      errors[fieldName] = validation.error!;
      isValid = false;
    }
  });

  return { isValid, errors };
}

// Validate file upload (legacy function)
export function validateFile(file: File) {
  const errors: string[] = [];

  if (!file) {
    errors.push('File is required');
    return { isValid: false, error: errors[0] };
  }

  // Check file size
  if (file.size > fileSchema.maxSize) {
    errors.push(
      `File size must be less than ${fileSchema.maxSize / (1024 * 1024)}MB`,
    );
  }

  // Check file type
  if (!fileSchema.allowedTypes.includes(file.type)) {
    errors.push(
      `File type must be one of: ${fileSchema.allowedTypes.join(', ')}`,
    );
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = fileSchema.allowedExtensions.some((ext) =>
    fileName.endsWith(ext),
  );

  if (!hasValidExtension) {
    errors.push(
      `File extension must be one of: ${fileSchema.allowedExtensions.join(', ')}`,
    );
  }

  return {
    isValid: errors.length === 0,
    error: errors[0] || null,
  };
}

// Sanitize text input
export function sanitizeText(text: any): string {
  if (!text) return '';

  return text
    .toString()
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}

// Sanitize avatar data
export function sanitizeAvatarData(data: any) {
  return {
    name: sanitizeText(data.name),
    personality: sanitizeText(data.personality),
    backgroundKnowledge: sanitizeText(data.backgroundKnowledge),
    voiceModel: sanitizeText(data.voiceModel),
    // Preserve other fields as-is
    ...Object.fromEntries(
      Object.entries(data).filter(
        ([key]) =>
          ![
            'name',
            'personality',
            'backgroundKnowledge',
            'voiceModel',
          ].includes(key),
      ),
    ),
  };
}

// Check if filename is safe
export function validateFileName(fileName: string) {
  const unsafeChars = /[<>:"/\\|?*\x00-\x1f]/;
  const maxLength = 255;

  if (!fileName || fileName.trim() === '') {
    return { isValid: false, error: 'Filename cannot be empty' };
  }

  if (fileName.length > maxLength) {
    return {
      isValid: false,
      error: `Filename must be less than ${maxLength} characters`,
    };
  }

  if (unsafeChars.test(fileName)) {
    return { isValid: false, error: 'Filename contains invalid characters' };
  }

  return { isValid: true, error: null };
}
