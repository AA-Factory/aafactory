import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import fs from 'fs';
import path from 'path';

export interface SaveFileResult {
  filePath: string;
  fileName: string;
  fileType: string;
}

export interface UploadResult {
  success: boolean;
  filePath: string; // relative path for serving
  fileName: string; // unique generated file name
  fullPath: string; // absolute file path
}

export interface DeleteResult {
  success: boolean;
  message: string;
}

export async function saveBase64File(
  base64Data: string,
  taskId: string,
  fileType: 'audio' | 'video',
): Promise<SaveFileResult> {
  try {
    // Remove data URL prefix if present (e.g., "data:audio/mp3;base64,")
    const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');

    // Determine file extension based on type and data URL
    const extension = getFileExtension(base64Data, fileType);
    const fileName = `${taskId}.${extension}`;

    // Create public directory path
    const publicDir = path.join(process.cwd(), 'public/uploads', fileType);
    const filePath = path.join(publicDir, fileName);

    // Ensure directory exists
    await ensureDirectoryExists(publicDir);

    // Convert base64 to buffer and save
    const buffer = Buffer.from(base64Content, 'base64');
    await fs.promises.writeFile(filePath, buffer as any);

    // Return relative path for web access
    const webPath = `/uploads/${fileType}/${fileName}`;

    return {
      filePath: webPath,
      fileName,
      fileType: extension,
    };
  } catch (error) {
    console.error('Error saving base64 file:', error);
    throw new Error(
      `Failed to save ${fileType} file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

function getFileExtension(
  base64Data: string,
  defaultType: 'audio' | 'video',
): string {
  // Check data URL for MIME type
  const dataUrlMatch = base64Data.match(/^data:([^;]+);base64,/);

  if (dataUrlMatch) {
    const mimeType = dataUrlMatch[1];

    // Audio extensions
    if (mimeType.includes('audio/mp3') || mimeType.includes('audio/mpeg'))
      return 'mp3';
    if (mimeType.includes('audio/wav')) return 'wav';
    if (mimeType.includes('audio/ogg')) return 'ogg';
    if (mimeType.includes('audio/aac')) return 'aac';

    // Video extensions
    if (mimeType.includes('video/mp4')) return 'mp4';
    if (mimeType.includes('video/webm')) return 'webm';
    if (mimeType.includes('video/ogg')) return 'ogv';
    if (mimeType.includes('video/avi')) return 'avi';
  }

  // Default extensions
  return defaultType === 'audio' ? 'mp3' : 'mp4';
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.promises.access(dirPath);
  } catch {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }
}

export async function deleteFile(filePath: string): Promise<DeleteResult> {
  try {
    const absolutePath = path.join(process.cwd(), 'public/uploads', filePath);

    if (!existsSync(absolutePath)) {
      return {
        success: true,
        message: 'File does not exist (already deleted)',
      };
    }

    await unlink(absolutePath);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Delete a file (legacy version for backward compatibility)
 */
export async function deleteFileSimple(filePath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), 'public/uploads', filePath);
    await fs.promises.unlink(fullPath);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw - file might already be deleted
  }
}

/**
 * Upload a file to a specified destination directory
 * @param blob - The file Blob or Buffer to upload
 * @param fileName - The original file name
 * @param destination - The destination directory (e.g., "avatars", "audio", "documents")
 */
export async function uploadFile(
  blob: Blob | Buffer,
  fileName: string,
  destination: string = 'image',
): Promise<UploadResult> {
  try {
    const uploadsDir = path.join(process.cwd(), 'public/uploads', destination);
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const extension = path.extname(fileName);
    const uniqueFileName = `${timestamp}-${Math.random()
      .toString(36)
      .substring(7)}${extension}`;

    const filePath = path.join(uploadsDir, uniqueFileName);
    const relativePath = `/uploads/${destination}/${uniqueFileName}`;

    let buffer: Buffer;
    if (blob instanceof Blob) {
      buffer = Buffer.from(await blob.arrayBuffer());
    } else if (Buffer.isBuffer(blob)) {
      buffer = blob;
    } else {
      throw new Error('Invalid file type. Expected Blob or Buffer.');
    }

    await writeFile(filePath, buffer as any);

    return {
      success: true,
      filePath: relativePath,
      fileName: uniqueFileName,
      fullPath: filePath,
    };
  } catch (error: any) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Upload an image file to the image directory
 * @param blob - The image file Blob or Buffer to upload
 * @param fileName - The original file name
 */
export async function uploadAvatarImage(
  blob: Blob | Buffer,
  fileName: string,
): Promise<UploadResult> {
  return uploadFile(blob, fileName, 'image');
}

/**
 * Upload an audio file to the audio directory
 * @param blob - The audio file Blob or Buffer to upload
 * @param fileName - The original file name
 */
export async function uploadTrainingAudio(
  blob: Blob | Buffer,
  fileName: string,
): Promise<UploadResult> {
  return uploadFile(blob, fileName, 'audio');
}

export async function cleanAllDirectories() {
  const baseDir = path.join(process.cwd(), 'public/uploads');
  const directories = ['audio', 'image', 'video'];

  for (const dir of directories) {
    const dirPath = path.join(baseDir, dir);

    try {
      if (existsSync(dirPath)) {
        const files = await fs.promises.readdir(dirPath);

        for (const file of files) {
          const filePath = path.join(dirPath, file);

          try {
            // Check if it's a file or directory
            const stats = await fs.promises.stat(filePath);

            if (stats.isFile()) {
              await fs.promises.unlink(filePath);
              console.log(`Deleted file: ${filePath}`);
            } else if (stats.isDirectory()) {
              // Recursively remove directory and its contents
              await fs.promises.rmdir(filePath, { recursive: true });
              console.log(`Deleted directory: ${filePath}`);
            }
          } catch (fileError) {
            console.error(`Error deleting ${filePath}:`, fileError);
            // Continue with other files even if one fails
          }
        }

        console.log(`Cleaned directory: ${dirPath}`);
      } else {
        console.log(`Directory does not exist: ${dirPath}`);
      }
    } catch (dirError) {
      console.error(`Error processing directory ${dirPath}:`, dirError);
    }
  }
}

export async function cleanSpecificDirectories(directories: string[]) {
  const baseDir = path.join(process.cwd(), 'public/uploads');
  const validDirectories = ['audio', 'image', 'video'];

  for (const dir of directories) {
    if (!validDirectories.includes(dir)) {
      console.warn(
        `Invalid directory: ${dir}. Valid directories: ${validDirectories.join(', ')}`,
      );
      continue;
    }

    const dirPath = path.join(baseDir, dir);

    try {
      if (existsSync(dirPath)) {
        const files = await fs.promises.readdir(dirPath);

        for (const file of files) {
          const filePath = path.join(dirPath, file);

          try {
            // Check if it's a file or directory
            const stats = await fs.promises.stat(filePath);

            if (stats.isFile()) {
              await fs.promises.unlink(filePath);
              console.log(`Deleted file: ${filePath}`);
            } else if (stats.isDirectory()) {
              // Recursively remove directory and its contents
              await fs.promises.rmdir(filePath, { recursive: true });
              console.log(`Deleted directory: ${filePath}`);
            }
          } catch (fileError) {
            console.error(`Error deleting ${filePath}:`, fileError);
            // Continue with other files even if one fails
          }
        }

        console.log(`Cleaned directory: ${dirPath}`);
      } else {
        console.log(`Directory does not exist: ${dirPath}`);
      }
    } catch (dirError) {
      console.error(`Error processing directory ${dirPath}:`, dirError);
    }
  }
}
