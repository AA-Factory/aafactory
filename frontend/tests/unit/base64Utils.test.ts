import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { fileToBase64, encodeMediaFile, createMediaResponse } from '@/lib/base64Utils';

// Mock browser-specific APIs for Node environment
class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;

  readAsDataURL(blob: Blob) {
    blob.arrayBuffer().then(buffer => {
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = blob.type || 'application/octet-stream';
      this.result = `data:${mimeType};base64,${base64}`;

      if (this.onloadend) {
        this.onloadend({} as any);
      }
    }).catch(() => {
      if (this.onerror) {
        this.onerror({} as any);
      }
    });
  }
}

// Setup mocks before all tests
beforeAll(() => {
  // Mock FileReader (browser API)
  global.FileReader = MockFileReader as any;

  // Mock URL.createObjectURL (browser API)
  global.URL.createObjectURL = vi.fn((blob: Blob) => {
    return `blob:http://localhost/${Math.random().toString(36).substring(7)}`;
  });

  global.URL.revokeObjectURL = vi.fn();
});

describe('Base64 Utils - Node Environment', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fileToBase64', () => {
    it('should convert a File to base64 string', async () => {
      const fileContent = 'Hello, World!';
      const file = new File([fileContent], 'test.txt', { type: 'text/plain' });

      const base64 = await fileToBase64(file);

      expect(base64).toBeTruthy();
      expect(typeof base64).toBe('string');
      expect(base64).toMatch(/^[A-Za-z0-9+/=]+$/);

      // Verify content by decoding
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');
      expect(decoded).toBe(fileContent);
    });

    it('should handle image files', async () => {
      // 1x1 transparent PNG
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const pngBuffer = Buffer.from(pngBase64, 'base64');

      const file = new File([pngBuffer], 'test.png', { type: 'image/png' });
      const base64 = await fileToBase64(file);

      expect(base64).toBeTruthy();
      expect(base64.length).toBeGreaterThan(0);

      // Verify it's valid base64
      expect(() => Buffer.from(base64, 'base64')).not.toThrow();
    });

    it('should handle audio files', async () => {
      const audioData = Buffer.from([0xff, 0xf1, 0x50, 0x80]);
      const file = new File([audioData], 'test.mp3', { type: 'audio/mp3' });

      const base64 = await fileToBase64(file);

      expect(base64).toBeTruthy();
      expect(typeof base64).toBe('string');

      // Verify data integrity
      const decoded = Buffer.from(base64, 'base64');
      expect(Array.from(decoded)).toEqual(Array.from(audioData));
    });

    it('should handle video files', async () => {
      const videoData = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]);
      const file = new File([videoData], 'test.mp4', { type: 'video/mp4' });

      const base64 = await fileToBase64(file);

      expect(base64).toBeTruthy();
      const decoded = Buffer.from(base64, 'base64');
      expect(Array.from(decoded)).toEqual(Array.from(videoData));
    });

    it('should reject when no file is provided', async () => {
      await expect(fileToBase64(null as any)).rejects.toThrow('No file provided');
    });

    it('should handle empty files', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });
      const base64 = await fileToBase64(file);

      expect(base64).toBe('');
    });

    it('should handle large files', async () => {
      // Create a 1MB file
      const largeData = Buffer.alloc(1024 * 1024, 'A');
      const file = new File([largeData], 'large.txt', { type: 'text/plain' });

      const base64 = await fileToBase64(file);

      expect(base64).toBeTruthy();
      expect(base64.length).toBeGreaterThan(1000000);
    });

    it('should handle binary data correctly', async () => {
      const binaryData = Buffer.from([0x00, 0xFF, 0x00, 0xFF, 0xAB, 0xCD]);
      const file = new File([binaryData], 'binary.dat', { type: 'application/octet-stream' });

      const base64 = await fileToBase64(file);

      const decoded = Buffer.from(base64, 'base64');
      expect(Array.from(decoded)).toEqual(Array.from(binaryData));
    });
  });

  describe('encodeMediaFile', () => {
    it('should encode a File object', async () => {
      const fileContent = 'Test audio content';
      const file = new File([fileContent], 'audio.mp3', { type: 'audio/mp3' });

      const result = await encodeMediaFile(file);

      expect(result.base64).toBeTruthy();
      expect(result.filename).toBe('audio.mp3');
      expect(result.mimeType).toBe('audio/mp3');

      const decoded = Buffer.from(result.base64, 'base64').toString('utf-8');
      expect(decoded).toBe(fileContent);
    });

    it('should handle video files', async () => {
      const videoData = Buffer.from([0x00, 0x00, 0x00, 0x18]);
      const file = new File([videoData], 'video.mp4', { type: 'video/mp4' });

      const result = await encodeMediaFile(file);

      expect(result.base64).toBeTruthy();
      expect(result.filename).toBe('video.mp4');
      expect(result.mimeType).toBe('video/mp4');
    });

    it('should handle image files', async () => {
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const pngBuffer = Buffer.from(pngBase64, 'base64');
      const file = new File([pngBuffer], 'image.png', { type: 'image/png' });

      const result = await encodeMediaFile(file);

      expect(result.base64).toBeTruthy();
      expect(result.filename).toBe('image.png');
      expect(result.mimeType).toBe('image/png');
    });

    it('should fetch and encode from URL', async () => {
      const mockContent = 'mock audio data';
      const mockBlob = new Blob([mockContent], { type: 'audio/mp3' });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Map([['content-type', 'audio/mp3']]),
        status: 200,
      } as any);

      const result = await encodeMediaFile('https://example.com/audio.mp3');

      expect(result.base64).toBeTruthy();
      expect(result.filename).toBe('https://example.com/audio.mp3');
      expect(result.mimeType).toBe('audio/mp3');
      expect(fetch).toHaveBeenCalledWith('https://example.com/audio.mp3');
    });

    it('should use basePath for relative URLs', async () => {
      const mockBlob = new Blob(['test'], { type: 'audio/wav' });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Map([['content-type', 'audio/wav']]),
        status: 200,
      } as any);

      await encodeMediaFile('/audio/test.wav', 'https://example.com');

      expect(fetch).toHaveBeenCalledWith('https://example.com/audio/test.wav');
    });

    it('should handle fetch errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(
        encodeMediaFile('https://example.com/missing.mp3')
      ).rejects.toThrow('Failed to fetch media file');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        encodeMediaFile('https://example.com/audio.mp3')
      ).rejects.toThrow('Media encoding failed');
    });
  });

  describe('createMediaResponse', () => {
    it('should create audio response', () => {
      const testData = 'audio data';
      const base64Data = Buffer.from(testData).toString('base64');
      const taskId = 'task-123';

      const result = createMediaResponse(base64Data, taskId, 'audio');

      expect(result.base64).toBe(base64Data);
      expect(result.taskId).toBe(taskId);
      expect(result.filename).toContain('generated_audio_');
      expect(result.filename).toMatch(/\.wav$/);
      expect(result.url).toContain('blob:');
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should create video response', () => {
      const base64Data = Buffer.from('video data').toString('base64');
      const taskId = 'task-456';

      const result = createMediaResponse(base64Data, taskId, 'video');

      expect(result.base64).toBe(base64Data);
      expect(result.taskId).toBe(taskId);
      expect(result.filename).toContain('generated_video_');
      expect(result.filename).toMatch(/\.mp4$/);
      expect(result.url).toContain('blob:');
    });

    it('should create image response', () => {
      const base64Data = Buffer.from('image data').toString('base64');
      const taskId = 'task-789';

      const result = createMediaResponse(base64Data, taskId, 'image');

      expect(result.base64).toBe(base64Data);
      expect(result.taskId).toBe(taskId);
      expect(result.filename).toContain('generated_image_');
      expect(result.filename).toMatch(/\.png$/);
      expect(result.url).toContain('blob:');
    });

    it('should use custom mime type', () => {
      const base64Data = Buffer.from('audio data').toString('base64');
      const taskId = 'task-custom';

      const result = createMediaResponse(base64Data, taskId, 'audio', 'audio/mp3');

      expect(result.filename).toMatch(/\.mp3$/);
      expect(result.url).toContain('blob:');
    });

    it('should handle base64 data wrapped in object', () => {
      const base64String = Buffer.from('test data').toString('base64');
      const wrappedData = { message: base64String } as any;
      const taskId = 'task-wrapped';

      const result = createMediaResponse(wrappedData, taskId, 'audio');

      expect(result.base64).toBe(base64String);
    });

    it('should create unique filenames', () => {
      const base64Data = Buffer.from('test').toString('base64');

      const result1 = createMediaResponse(base64Data, 'task-1', 'audio');
      const result2 = createMediaResponse(base64Data, 'task-2', 'audio');

      expect(result1.filename).not.toBe(result2.filename);
    });

    it('should handle invalid base64 data', () => {
      const invalidBase64 = '!!!not-valid-base64!!!';

      expect(() => {
        createMediaResponse(invalidBase64, 'task-error', 'audio');
      }).toThrow();
    });

    it('should clean and pad base64 strings', () => {
      // Base64 with whitespace and newlines
      const messyBase64 = Buffer.from('test data').toString('base64') + '\n\r ';
      const taskId = 'task-messy';

      const result = createMediaResponse(messyBase64, taskId, 'audio');

      expect(result.base64).toBeTruthy();
      expect(result.url).toContain('blob:');
    });
  });

  describe('Error Handling', () => {
    it('should throw DecodingError for invalid base64', () => {
      const invalidBase64 = '!!!invalid!!!';

      expect(() => {
        createMediaResponse(invalidBase64, 'task-1', 'audio');
      }).toThrow();
    });

    it('should throw EncodingError for invalid file', async () => {
      await expect(
        fileToBase64(undefined as any)
      ).rejects.toThrow('No file provided');
    });

    it('should include error codes in custom errors', async () => {
      try {
        await fileToBase64(null as any);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe('ENCODING_ERROR');
        expect(error.name).toBe('Base64Error');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short base64 strings', () => {
      const shortBase64 = Buffer.from('A').toString('base64'); // "QQ=="
      const result = createMediaResponse(shortBase64, 'task-short', 'audio');

      expect(result.url).toContain('blob:');
    });

    it('should handle binary data with null bytes', async () => {
      const binaryData = Buffer.from([0x00, 0xFF, 0x00, 0xFF]);
      const file = new File([binaryData], 'binary.dat', {
        type: 'application/octet-stream'
      });

      const base64 = await fileToBase64(file);

      expect(base64).toBeTruthy();

      const decoded = Buffer.from(base64, 'base64');
      expect(Array.from(decoded)).toEqual(Array.from(binaryData));
    });

    it('should handle special characters in filenames', async () => {
      const file = new File(['test'], 'file with spaces & special.txt', {
        type: 'text/plain'
      });

      const result = await encodeMediaFile(file);

      expect(result.filename).toBe('file with spaces & special.txt');
    });

    it('should create blob URLs that can be revoked', () => {
      const base64Data = Buffer.from('test').toString('base64');
      const result = createMediaResponse(base64Data, 'task-1', 'audio');

      expect(result.url).toContain('blob:');

      // Should not throw when revoking
      expect(() => {
        URL.revokeObjectURL(result.url);
      }).not.toThrow();

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(result.url);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple conversions efficiently', async () => {
      const files = Array.from({ length: 10 }, (_, i) =>
        new File([`content ${i}`], `file${i}.txt`, { type: 'text/plain' })
      );

      const startTime = Date.now();
      const results = await Promise.all(files.map(file => fileToBase64(file)));
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(results.every(r => typeof r === 'string')).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle concurrent media responses', () => {
      const base64Data = Buffer.from('test data').toString('base64');

      const results = Array.from({ length: 100 }, (_, i) =>
        createMediaResponse(base64Data, `task-${i}`, 'audio')
      );

      expect(results).toHaveLength(100);
      expect(results.every(r => r.url.includes('blob:'))).toBe(true);

      // Clean up
      results.forEach(r => URL.revokeObjectURL(r.url));
    });
  });
});