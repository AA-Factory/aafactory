/**
 * Base64 encoding/decoding utilities for audio and file processing
 */

// Custom Error Classes
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
        if (!base64Data) {
          throw new EncodingError('Invalid file data format');
        }

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
    // Handle case where base64Data might be wrapped in an object
    const cleanData =
      typeof base64Data === 'string' ? base64Data : (base64Data as any).message;

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

    const url = base64ToObjectUrl(cleanData, mimeType);
    const filename = `generated_${mediaType}_${Date.now()}.${extension}`;

    return {
      base64: cleanData,
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
