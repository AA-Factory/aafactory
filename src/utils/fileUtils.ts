// utils/fileUtils.ts
import { writeFile, mkdir, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

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
/**
 * Upload a file to the uploads/avatars directory
 * @param blob - The file Blob or Buffer to upload
 * @param fileName - The original file name
 */
export async function uploadFile(
  blob: Blob | Buffer,
  fileName: string
): Promise<UploadResult> {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension);
    const uniqueFileName = `${timestamp}-${Math.random()
      .toString(36)
      .substring(7)}-${baseName}${extension}`;

    const filePath = path.join(uploadsDir, uniqueFileName);
    const relativePath = `/uploads/avatars/${uniqueFileName}`;

    let buffer: Buffer;
    if (blob instanceof Blob) {
      buffer = Buffer.from(await blob.arrayBuffer());
    } else if (Buffer.isBuffer(blob)) {
      buffer = blob;
    } else {
      throw new Error('Invalid file type. Expected Blob or Buffer.');
    }

    await writeFile(filePath, buffer);

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
 * Delete a file from the uploads/avatars directory
 * @param filePath - The relative file path (e.g., "/uploads/avatars/filename.png")
 */
export async function deleteFile(filePath: string): Promise<DeleteResult> {
  try {
    const absolutePath = path.join(process.cwd(), 'public', filePath);

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
