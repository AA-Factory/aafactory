import fs from 'fs';
import path from 'path';

export interface SaveFileResult {
  filePath: string;
  fileName: string;
  fileType: string;
}

export async function saveBase64File(
  base64Data: string,
  taskId: string,
  fileType: 'audio' | 'video'
): Promise<SaveFileResult> {
  try {
    // Remove data URL prefix if present (e.g., "data:audio/mp3;base64,")
    const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');

    // Determine file extension based on type and data URL
    const extension = getFileExtension(base64Data, fileType);
    const fileName = `${taskId}_${Date.now()}.${extension}`;

    // Create public directory path
    const publicDir = path.join(process.cwd(), 'public', fileType);
    const filePath = path.join(publicDir, fileName);

    // Ensure directory exists
    await ensureDirectoryExists(publicDir);

    // Convert base64 to buffer and save
    const buffer = Buffer.from(base64Content, 'base64');
    await fs.promises.writeFile(filePath, buffer as any);

    // Return relative path for web access
    const webPath = `/${fileType}/${fileName}`;

    return {
      filePath: webPath,
      fileName,
      fileType: extension
    };
  } catch (error) {
    console.error('Error saving base64 file:', error);
    throw new Error(`Failed to save ${fileType} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function getFileExtension(base64Data: string, defaultType: 'audio' | 'video'): string {
  // Check data URL for MIME type
  const dataUrlMatch = base64Data.match(/^data:([^;]+);base64,/);

  if (dataUrlMatch) {
    const mimeType = dataUrlMatch[1];

    // Audio extensions
    if (mimeType.includes('audio/mp3') || mimeType.includes('audio/mpeg')) return 'mp3';
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

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await fs.promises.unlink(fullPath);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw - file might already be deleted
  }
}