/**
 * Base64 encoding/decoding utilities for audio and file processing
 */

// Custom Error Classes
export class Base64Error extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'Base64Error';
  }
}

export class EncodingError extends Base64Error {
  constructor(message: string) {
    super(message, 'ENCODING_ERROR');
  }
}

export class DecodingError extends Base64Error {
  constructor(message: string) {
    super(message, 'DECODING_ERROR');
  }
}

/**
 * Cleans a base64 string by removing invalid characters and adding padding
 */
export function cleanBase64(base64String: string): string {
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
export function isValidBase64(str: string): boolean {
  // Check if string matches base64 pattern
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Pattern.test(str) && str.length % 4 === 0;
}

/**
 * Converts a base64 string to a Blob
 */
export function base64ToBlob(base64String: string, mimeType: string = 'audio/wav'): Blob {
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
    throw new DecodingError(`Failed to decode base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Converts a base64 string to an ArrayBuffer
 */
export function base64ToArrayBuffer(base64String: string): ArrayBuffer {
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

    return bytes.buffer;
  } catch (error) {
    if (error instanceof Base64Error) throw error;
    throw new DecodingError(`Failed to decode base64 to ArrayBuffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Converts a File to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
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
        reject(error instanceof EncodingError ? error : new EncodingError(`File encoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
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
export function blobToBase64(blob: Blob): Promise<string> {
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
        reject(error instanceof EncodingError ? error : new EncodingError(`Blob encoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new EncodingError('Failed to read blob'));
    };

    reader.readAsDataURL(blob);
  });
}

/**
 * Encodes an audio file (File or fetched from URL) to base64
 */
export async function encodeAudioFile(
  audioFile: string | File,
  basePath: string = '/test/training_audio/'
): Promise<{ base64: string; filename: string; mimeType?: string }> {
  try {
    let blob: Blob;
    let filename: string;
    let mimeType: string | undefined;

    if (audioFile instanceof File) {
      blob = audioFile;
      filename = audioFile.name;
      mimeType = audioFile.type;
    } else {
      // Fetch from URL
      const url = audioFile.startsWith('http') ? audioFile : `${basePath}${audioFile}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new EncodingError(`Failed to fetch audio file: ${audioFile} (${response.status})`);
      }

      blob = await response.blob();
      filename = audioFile;
      mimeType = response.headers.get('content-type') || undefined;
    }

    const base64 = await blobToBase64(blob);

    return {
      base64,
      filename,
      mimeType
    };
  } catch (error) {
    if (error instanceof Base64Error) throw error;
    throw new EncodingError(`Audio encoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates a data URL from base64 string
 */
export function base64ToDataUrl(base64String: string, mimeType: string = 'audio/wav'): string {
  try {
    const cleanedBase64 = cleanBase64(base64String);

    if (!isValidBase64(cleanedBase64)) {
      throw new DecodingError('Invalid base64 string format');
    }

    return `data:${mimeType};base64,${cleanedBase64}`;
  } catch (error) {
    if (error instanceof Base64Error) throw error;
    throw new DecodingError(`Failed to create data URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates an object URL from base64 string
 */
export function base64ToObjectUrl(base64String: string, mimeType: string = 'audio/wav'): string {
  try {
    const blob = base64ToBlob(base64String, mimeType);
    return URL.createObjectURL(blob);
  } catch (error) {
    if (error instanceof Base64Error) throw error;
    throw new DecodingError(`Failed to create object URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Utility to safely revoke object URLs
 */
export function revokeObjectUrl(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    console.warn('Failed to revoke object URL:', error);
  }
}

/**
 * Gets the size of base64 encoded data in bytes
 */
export function getBase64Size(base64String: string): number {
  const cleanedBase64 = cleanBase64(base64String);
  // Base64 encoding adds ~33% overhead, so actual size is ~75% of base64 length
  return Math.floor((cleanedBase64.length * 3) / 4);
}

/**
 * Compresses base64 string by reducing quality (for images/audio)
 * Note: This is a simple implementation and may not work for all formats
 */
export function compressBase64(
  base64String: string,
  quality: number = 0.8,
  mimeType: string = 'audio/wav'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      if (quality < 0 || quality > 1) {
        throw new EncodingError('Quality must be between 0 and 1');
      }

      // For audio files, we can't easily compress without specialized libraries
      // This is a placeholder that could be enhanced with actual compression
      if (mimeType.startsWith('audio/')) {
        // For now, just return the original (could integrate with audio compression libraries)
        resolve(base64String);
        return;
      }

      // For images, we could use canvas compression
      if (mimeType.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new EncodingError('Failed to get canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                reject(new EncodingError('Failed to compress image'));
                return;
              }
              try {
                const compressedBase64 = await blobToBase64(blob);
                resolve(compressedBase64);
              } catch (error) {
                reject(error);
              }
            },
            mimeType,
            quality
          );
        };

        img.onerror = () => reject(new EncodingError('Failed to load image for compression'));
        img.src = base64ToDataUrl(base64String, mimeType);
      } else {
        // For other types, return as-is
        resolve(base64String);
      }
    } catch (error) {
      reject(error instanceof Base64Error ? error : new EncodingError(`Compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}