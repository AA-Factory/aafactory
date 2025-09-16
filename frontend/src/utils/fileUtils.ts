// utils/fileUtils.ts
import { writeFile, mkdir, unlink, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

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
 * Upload a file to a specified destination directory
 * @param blob - The file Blob or Buffer to upload
 * @param fileName - The original file name
 * @param destination - The destination directory (e.g., "avatars", "audio", "documents")
 */
export async function uploadFile(
  blob: Blob | Buffer,
  fileName: string,
  destination: string = "avatars",
): Promise<UploadResult> {
  try {
    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      destination,
    );
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
      throw new Error("Invalid file type. Expected Blob or Buffer.");
    }

    await writeFile(filePath, buffer as any);

    return {
      success: true,
      filePath: relativePath,
      fileName: uniqueFileName,
      fullPath: filePath,
    };
  } catch (error: any) {
    console.error("Error uploading file:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Delete a file from the uploads directory
 * @param filePath - The relative file path (e.g., "/uploads/avatars/filename.png", "/uploads/audio/filename.mp3")
 */
export async function deleteFile(filePath: string): Promise<DeleteResult> {
  try {
    const absolutePath = path.join(process.cwd(), "public", filePath);

    if (!existsSync(absolutePath)) {
      return {
        success: true,
        message: "File does not exist (already deleted)",
      };
    }

    await unlink(absolutePath);

    return {
      success: true,
      message: "File deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting file:", error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Upload an image file to the avatars directory
 * @param blob - The image file Blob or Buffer to upload
 * @param fileName - The original file name
 */
export async function uploadAvatarImage(
  blob: Blob | Buffer,
  fileName: string,
): Promise<UploadResult> {
  return uploadFile(blob, fileName, "avatars");
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
  return uploadFile(blob, fileName, "audio");
}
