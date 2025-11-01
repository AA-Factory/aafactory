import { v4 as uuidv4 } from 'uuid';
import { b } from 'vitest/dist/chunks/suite.d.BJWk38HB';
class Base64Error extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'Base64Error';
  }
}

class EncodingError extends Base64Error {
  constructor(message: string) {
    super(message, 'ENCODING_ERROR');
  }
}

class DecodingError extends Base64Error {
  constructor(message: string) {
    super(message, 'DECODING_ERROR');
  }
}

/**
 * Cleans a base64 string by removing invalid characters and adding padding
 */
function cleanBase64(base64String: string): string {
  // Remove any characters that aren't valid base64
  let cleaned = base64String.replace(/[^A-Za-z0-9+/=]/g, '');

  // Add padding if needed
  while (cleaned.length % 4) {
    cleaned += '=';
  }

  return cleaned;
}

/**
 * Check if string contains only valid base64 characters (before cleaning)
 * Valid: A-Z, a-z, 0-9, +, /, =, and common formatting (whitespace, newlines, data URIs)
 */
function hasValidBase64Characters(str: string): boolean {
  // Remove common formatting that we can clean
  const withoutDataUri = str.replace(/^data:[^;]+;base64,/, '');
  const withoutWhitespace = withoutDataUri.replace(/[\s\n\r]/g, '');

  // Now check if remaining characters are valid base64 alphabet
  const base64Regex = /^[A-Za-z0-9+/=]*$/;
  return base64Regex.test(withoutWhitespace);
}

/**
 * Extract base64 string from various input formats
 */
function extractBase64String(input: unknown): string {
  // Already a string
  if (typeof input === 'string') {
    return input;
  }

  // Not an object or is null
  if (typeof input !== 'object' || input === null) {
    throw new DecodingError(
      `Invalid base64 input type: expected string or object, got ${typeof input}`
    );
  }

  // Try common property names where base64 might be stored
  const obj = input as Record<string, any>;
  const possibleKeys = ['message', 'data', 'base64', 'content', 'value'];

  for (const key of possibleKeys) {
    if (key in obj && typeof obj[key] === 'string') {
      return obj[key];
    }
  }

  // If we have a single string property, use that
  const keys = Object.keys(obj);
  if (keys.length === 1 && typeof obj[keys[0]] === 'string') {
    return obj[keys[0]];
  }

  throw new DecodingError(
    `Could not extract base64 string from object. Expected properties: ${possibleKeys.join(', ')}`
  );
}


/**
 * Validates if a string is a valid base64 format
 */
function isValidBase64(str: string): boolean {
  // Check if string matches base64 pattern
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Pattern.test(str) && str.length % 4 === 0;
}

/**
 * Converts a base64 string to a Blob
 */
function base64ToBlob(base64String: string, mimeType = 'audio/wav'): Blob {
  try {
    const cleanedBase64 = cleanBase64(base64String);

    if (!isValidBase64(cleanedBase64)) {
      throw new DecodingError('Invalid base64 string format');
    }

    const binaryString = atob(cleanedBase64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Blob([bytes], { type: mimeType });
  } catch (error) {
    if (error instanceof Base64Error) throw error;
    throw new DecodingError(
      `Failed to decode base64: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Converts a File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new EncodingError('No file provided'));
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      try {
        const result = reader.result as string;
        if (!result) {
          throw new EncodingError('Failed to read file');
        }

        // Extract base64 data (remove data:mime;base64, prefix)
        const base64Data = result.split(',')[1];
        // if (!base64Data) {
        //   throw new EncodingError('Invalid file data format');
        // }

        resolve(base64Data);
      } catch (error) {
        reject(
          error instanceof EncodingError
            ? error
            : new EncodingError(
              `File encoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ),
        );
      }
    };

    reader.onerror = () => {
      reject(new EncodingError('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Converts a Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!blob) {
      reject(new EncodingError('No blob provided'));
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      try {
        const result = reader.result as string;
        if (!result) {
          throw new EncodingError('Failed to read blob');
        }

        // Extract base64 data (remove data:mime;base64, prefix)
        const base64Data = result.split(',')[1];
        if (!base64Data) {
          throw new EncodingError('Invalid blob data format');
        }

        resolve(base64Data);
      } catch (error) {
        reject(
          error instanceof EncodingError
            ? error
            : new EncodingError(
              `Blob encoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ),
        );
      }
    };

    reader.onerror = () => {
      reject(new EncodingError('Failed to read blob'));
    };

    reader.readAsDataURL(blob);
  });
}

/**
 * Generic function to encode media files (File or fetched from URL) to base64
 */
export async function encodeMediaFile(
  mediaFile: string | File,
  basePath?: string,
): Promise<{ base64: string; filename: string; mimeType?: string }> {
  try {
    let blob: Blob;
    let filename: string;
    let mimeType: string | undefined;

    if (mediaFile instanceof File) {
      blob = mediaFile;
      filename = mediaFile.name;
      mimeType = mediaFile.type;
    } else {
      // Handle URL or path
      let url: string;
      if (mediaFile.startsWith('http')) {
        url = mediaFile;
      } else if (basePath) {
        url = `${basePath}${mediaFile}`;
      } else {
        url = mediaFile;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new EncodingError(
          `Failed to fetch media file: ${mediaFile} (${response.status})`,
        );
      }

      blob = await response.blob();
      filename = mediaFile;
      mimeType = response.headers.get('content-type') || undefined;
    }

    const base64 = await blobToBase64(blob);

    return {
      base64,
      filename,
      mimeType,
    };
  } catch (error) {
    if (error instanceof Base64Error) throw error;
    throw new EncodingError(
      `Media encoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Creates an object URL from base64 string
 */
function base64ToObjectUrl(
  base64String: string,
  mimeType = 'audio/wav',
): string {
  try {
    const blob = base64ToBlob(base64String, mimeType);
    return URL.createObjectURL(blob);
  } catch (error) {
    if (error instanceof Base64Error) throw error;
    throw new DecodingError(
      `Failed to create object URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Creates a standardized media response object from base64 data
 */
export function createMediaResponse(
  base64Data: string,
  taskId: string,
  mediaType: 'audio' | 'video' | 'image',
  customMimeType?: string,
): { base64: string; url: string; filename: string; taskId: string } {
  try {

    const extractedData = extractBase64String(base64Data);

    // STEP 2: Check if it contains valid base64 characters
    if (!hasValidBase64Characters(extractedData)) {
      throw new DecodingError(
        'Invalid base64 data: Contains invalid characters that cannot be cleaned'
      );
    }

    // STEP 3: Clean the data (removes whitespace, data URIs, fixes padding)
    const cleanDataFinal = cleanBase64(extractedData);

    // STEP 4: Validate the cleaned result
    if (!isValidBase64(cleanDataFinal)) {
      throw new DecodingError(
        'Invalid base64 data: Data could not be properly formatted'
      );
    }
    // Determine MIME type and file extension
    let mimeType: string;
    let extension: string;

    if (customMimeType) {
      mimeType = customMimeType;
      extension = customMimeType.split('/')[1] || mediaType;
    } else {
      switch (mediaType) {
        case 'audio':
          mimeType = 'audio/wav';
          extension = 'wav';
          break;
        case 'video':
          mimeType = 'video/mp4';
          extension = 'mp4';
          break;
        case 'image':
          mimeType = 'image/png';
          extension = 'png';
          break;
        default:
          mimeType = 'application/octet-stream';
          extension = 'bin';
      }
    }

    const url = base64ToObjectUrl(cleanDataFinal, mimeType);
    const filename = `generated_${mediaType}_${uuidv4()}.${extension}`;

    return {
      base64: cleanDataFinal,
      url,
      filename,
      taskId: taskId,
    };
  } catch (error) {
    if (error instanceof Base64Error) throw error;
    throw new DecodingError(
      `Failed to create media response: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
