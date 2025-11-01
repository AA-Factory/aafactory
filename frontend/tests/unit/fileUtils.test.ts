// tests/unit/fileUtils.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveBase64File, uploadFile, deleteFile, uploadTrainingAudio, cleanAllDirectories } from '../../src/lib/fileUtils';
import { BASE_UPLOAD_DIR } from '../../src/lib/resource/constants';
import fs from 'fs';
import path from 'path';
describe('File Utilities', () => {
  const testBaseDir = path.join(process.cwd(), 'public', BASE_UPLOAD_DIR);

  afterEach(async () => {
    await cleanAllDirectories();
  });

  describe('saveBase64File', () => {
    it('should save a base64 PNG image', async () => {
      const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const taskId = 'test-task-123';

      const result = await saveBase64File(base64Data, taskId, 'image');

      expect(result.fileName).toBe('test-task-123.png');
      expect(result.fileType).toBe('png');
      expect(result.filePath).toBe(`/${BASE_UPLOAD_DIR}/image/test-task-123.png`);

      // Verify file exists on disk
      const fullPath = path.join(process.cwd(), 'public', result.filePath);
      expect(fs.existsSync(fullPath)).toBe(true);

      // Verify file content
      const fileBuffer = await fs.promises.readFile(fullPath);
      expect(fileBuffer.length).toBeGreaterThan(0);
    });

    it('should save a base64 MP3 audio file', async () => {
      const base64Data = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC';
      const taskId = 'audio-test';

      const result = await saveBase64File(base64Data, taskId, 'audio');

      expect(result.fileName).toBe('audio-test.mp3');
      expect(result.fileType).toBe('mp3');
      expect(result.filePath).toBe(`/${BASE_UPLOAD_DIR}/audio/audio-test.mp3`);
    });

    it('should save a base64 MP4 video file', async () => {
      const base64Data = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAu1tZGF0';
      const taskId = 'video-test';

      const result = await saveBase64File(base64Data, taskId, 'video');

      expect(result.fileName).toBe('video-test.mp4');
      expect(result.fileType).toBe('mp4');
      expect(result.filePath).toBe(`/${BASE_UPLOAD_DIR}/video/video-test.mp4`);
    });

    it('should handle base64 without data URL prefix', async () => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const taskId = 'no-prefix-test';

      const result = await saveBase64File(base64Data, taskId, 'image');

      expect(result.fileName).toBe('no-prefix-test.png');
      const fullPath = path.join(process.cwd(), 'public', result.filePath);
      expect(fs.existsSync(fullPath)).toBe(true);
    });

    it('should throw error for invalid base64', async () => {
      const invalidBase64 = 'dddata:image/png;base64,invalid!!!data';

      await expect(
        saveBase64File('', 'test', 'image')
      ).rejects.toThrow();
    });
  });

  describe('uploadFile', () => {
    it('should upload a Buffer', async () => {
      const buffer = Buffer.from('test file content');
      const fileName = 'test.txt';

      const result = await uploadFile(buffer, fileName, 'image');

      expect(result.success).toBe(true);
      expect(result.fileName).toMatch(/^\d+-[a-z0-9]+\.txt$/);
      expect(result.filePath).toContain(`/${BASE_UPLOAD_DIR}/image/`);
      expect(fs.existsSync(result.fullPath)).toBe(true);

      // Verify content
      const content = await fs.promises.readFile(result.fullPath, 'utf-8');
      expect(content).toBe('test file content');
    });

    it('should upload a Blob', async () => {
      const blob = new Blob(['blob content'], { type: 'text/plain' });
      const fileName = 'blob-test.txt';

      const result = await uploadFile(blob, fileName, 'audio');

      expect(result.success).toBe(true);
      expect(result.filePath).toContain(`/${BASE_UPLOAD_DIR}/audio/`);
      expect(fs.existsSync(result.fullPath)).toBe(true);
    });

    it('should generate unique filenames', async () => {
      const buffer = Buffer.from('test');

      const result1 = await uploadFile(buffer, 'test.txt', 'image');
      const result2 = await uploadFile(buffer, 'test.txt', 'image');

      expect(result1.fileName).not.toBe(result2.fileName);
    });

    it('should preserve file extension', async () => {
      const buffer = Buffer.from('test');

      const pngResult = await uploadFile(buffer, 'image.png', 'image');
      const jpgResult = await uploadFile(buffer, 'photo.jpg', 'image');

      expect(pngResult.fileName).toMatch(/\.png$/);
      expect(jpgResult.fileName).toMatch(/\.jpg$/);
    });

    it('should throw error for invalid file type', async () => {
      const invalidInput = 'not a buffer or blob' as any;

      await expect(
        uploadFile(invalidInput, 'test.txt', 'image')
      ).rejects.toThrow('Invalid file type');
    });
  });

  describe('uploadTrainingAudio', () => {
    it('should upload audio to audio directory', async () => {
      const buffer = Buffer.from('audio data');
      const fileName = 'training.mp3';

      const result = await uploadTrainingAudio(buffer, fileName);

      expect(result.success).toBe(true);
      expect(result.filePath).toContain(`/${BASE_UPLOAD_DIR}/audio/`);
      expect(fs.existsSync(result.fullPath)).toBe(true);
    });
  });

  describe('deleteFile', () => {
    it('should delete an existing file', async () => {
      // First create a file
      const buffer = Buffer.from('to be deleted');
      const uploadResult = await uploadFile(buffer, 'delete-me.txt', 'image');

      expect(fs.existsSync(uploadResult.fullPath)).toBe(true);

      // Now delete it
      const deleteResult = await deleteFile(uploadResult.filePath);

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.message).toBe('File deleted successfully');
      expect(fs.existsSync(uploadResult.fullPath)).toBe(false);
    });

    it('should handle deletion of non-existent file gracefully', async () => {
      const result = await deleteFile('/uploads/image/non-existent.txt');

      expect(result.success).toBe(true);
      expect(result.message).toContain('already deleted');
    });

    it('should handle file path with /uploads/ prefix', async () => {
      const buffer = Buffer.from('test');
      const uploadResult = await uploadFile(buffer, 'test.txt', 'image');

      const deleteResult = await deleteFile(uploadResult.filePath);

      expect(deleteResult.success).toBe(true);
    });
  });
});