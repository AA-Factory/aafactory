// utils/fileUtils.js
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Upload a file to the uploads/avatars directory
 * @param {Blob|File} blob - The file blob to upload
 * @param {string} fileName - The desired filename
 * @returns {Promise<{success: boolean, filePath: string, fileName: string}>}
 */
export async function uploadFile(blob, fileName) {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension);
    const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(7)}-${baseName}${extension}`;

    const filePath = path.join(uploadsDir, uniqueFileName);
    const relativePath = `/uploads/avatars/${uniqueFileName}`;

    // Convert blob to buffer and save
    let buffer;
    if (blob instanceof Blob) {
      const arrayBuffer = await blob.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (blob instanceof Buffer) {
      buffer = blob;
    } else {
      throw new Error('Invalid file type. Expected Blob or Buffer.');
    }

    await writeFile(filePath, buffer);

    return {
      success: true,
      filePath: relativePath,
      fileName: uniqueFileName,
      fullPath: filePath
    };

  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Delete a file from the uploads/avatars directory
 * @param {string} filePath - The relative file path (e.g., "/uploads/avatars/filename.png")
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteFile(filePath) {
  try {
    // Convert relative path to absolute path
    const absolutePath = path.join(process.cwd(), 'public', filePath);

    // Check if file exists
    if (!existsSync(absolutePath)) {
      return {
        success: true,
        message: 'File does not exist (already deleted)'
      };
    }

    // Delete the file
    await unlink(absolutePath);

    return {
      success: true,
      message: 'File deleted successfully'
    };

  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Delete a file by filename from the uploads/avatars directory
 * @param {string} fileName - The filename to delete
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteFileByName(fileName) {
  const relativePath = `/uploads/avatars/${fileName}`;
  return deleteFile(relativePath);
}

/**
 * Check if a file exists
 * @param {string} filePath - The relative file path
 * @returns {boolean}
 */
export function fileExists(filePath) {
  const absolutePath = path.join(process.cwd(), 'public', filePath);
  return existsSync(absolutePath);
}

/**
 * Get file info
 * @param {string} filePath - The relative file path
 * @returns {Promise<{exists: boolean, size?: number, created?: Date}>}
 */
export async function getFileInfo(filePath) {
  try {
    const absolutePath = path.join(process.cwd(), 'public', filePath);

    if (!existsSync(absolutePath)) {
      return { exists: false };
    }

    const { stat } = await import('fs/promises');
    const stats = await stat(absolutePath);

    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };

  } catch (error) {
    console.error('Error getting file info:', error);
    return { exists: false };
  }
}