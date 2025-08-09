// src/utils/validation.js

// Avatar validation schema
export const avatarSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_\s-]+$/,
    message: 'Name must be 2-50 characters, alphanumeric with underscores, spaces, and hyphens only'
  },
  personality: {
    required: true,
    minLength: 10,
    maxLength: 500,
    message: 'Personality must be 10-500 characters'
  },
  backgroundKnowledge: {
    required: true,
    minLength: 10,
    maxLength: 1000,
    message: 'Background knowledge must be 10-1000 characters'
  },
  voiceModel: {
    required: true,
    enum: ['elevenlabs', 'openai', 'azure', 'google'],
    message: 'Voice model must be one of: elevenlabs, openai, azure, google'
  }
};

// File validation schema
export const fileSchema = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
};

// Validate a single field
export function validateField(fieldName, value, schema = avatarSchema) {
  const rules = schema[fieldName];
  if (!rules) return { isValid: true, error: null };

  const errors = [];

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
  if (rules.minLength && stringValue.length < rules.minLength) {
    errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
  }

  if (rules.maxLength && stringValue.length > rules.maxLength) {
    errors.push(`${fieldName} must be no more than ${rules.maxLength} characters`);
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    errors.push(rules.message || `${fieldName} format is invalid`);
  }

  // Enum validation
  if (rules.enum && !rules.enum.includes(stringValue)) {
    errors.push(rules.message || `${fieldName} must be one of: ${rules.enum.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    error: errors[0] || null
  };
}

// Validate entire avatar object
export function validateAvatar(avatarData) {
  const errors = {};
  let isValid = true;

  // Validate each field
  Object.keys(avatarSchema).forEach(fieldName => {
    const validation = validateField(fieldName, avatarData[fieldName]);
    if (!validation.isValid) {
      errors[fieldName] = validation.error;
      isValid = false;
    }
  });

  return { isValid, errors };
}

// Validate file upload
export function validateFile(file) {
  const errors = [];

  if (!file) {
    errors.push('File is required');
    return { isValid: false, error: errors[0] };
  }

  // Check file size
  if (file.size > fileSchema.maxSize) {
    errors.push(`File size must be less than ${fileSchema.maxSize / (1024 * 1024)}MB`);
  }

  // Check file type
  if (!fileSchema.allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${fileSchema.allowedTypes.join(', ')}`);
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = fileSchema.allowedExtensions.some(ext =>
    fileName.endsWith(ext)
  );

  if (!hasValidExtension) {
    errors.push(`File extension must be one of: ${fileSchema.allowedExtensions.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    error: errors[0] || null
  };
}

// Sanitize text input
export function sanitizeText(text) {
  if (!text) return '';

  return text
    .toString()
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}

// Sanitize avatar data
export function sanitizeAvatarData(data) {
  return {
    name: sanitizeText(data.name),
    personality: sanitizeText(data.personality),
    backgroundKnowledge: sanitizeText(data.backgroundKnowledge),
    voiceModel: sanitizeText(data.voiceModel),
    // Preserve other fields as-is
    ...Object.fromEntries(
      Object.entries(data).filter(([key]) =>
        !['name', 'personality', 'backgroundKnowledge', 'voiceModel'].includes(key)
      )
    )
  };
}

// Check if filename is safe
export function validateFileName(fileName) {
  const unsafeChars = /[<>:"/\\|?*\x00-\x1f]/;
  const maxLength = 255;

  if (!fileName || fileName.trim() === '') {
    return { isValid: false, error: 'Filename cannot be empty' };
  }

  if (fileName.length > maxLength) {
    return { isValid: false, error: `Filename must be less than ${maxLength} characters` };
  }

  if (unsafeChars.test(fileName)) {
    return { isValid: false, error: 'Filename contains invalid characters' };
  }

  return { isValid: true, error: null };
}