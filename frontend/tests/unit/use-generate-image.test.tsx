import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGenerateImage } from '@/hooks/use-generate-image';
import { apiClient } from '@/lib/api-client';
import { ReactNode } from 'react';
import * as imageService from '@/services/image-service';

// Mock modules BEFORE imports
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/services/image-service', () => ({
  prepareImageData: vi.fn(),
  createImageResponse: vi.fn(),
}));

// Mock NotificationContext
const mockShowNotification = vi.fn();
vi.mock('@/contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: mockShowNotification,
  }),
  NotificationProvider: ({ children }: { children: ReactNode }) => children,
}));

describe('useGenerateImage', () => {
  let queryClient: QueryClient;

  // Create wrapper with QueryClient
  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('Successful image generation', () => {
    it('should generate image successfully', async () => {
      const mockPayload = {
        avatar: { id: 'avatar-123', name: 'Test Avatar' },
        positivePrompt: 'A beautiful landscape',
        negativePrompt: 'ugly, blurry',
      };

      const mockTaskRequest = {
        server_name: 'image-server',
        task_name: 'generate_image',
        payload: { prompt: 'A beautiful landscape' },
      };

      const mockTaskId = 'task-123';
      const mockBase64Image = 'base64-image-data';

      // Mock prepareImageData
      vi.mocked(imageService.prepareImageData).mockResolvedValue({
        taskRequest: mockTaskRequest,
      } as any);

      // Mock createImageResponse
      vi.mocked(imageService.createImageResponse).mockReturnValue({
        base64Image: mockBase64Image,
        url: 'blob:http://localhost/image',
        filename: 'image.png',
        taskId: mockTaskId,
      } as any);

      // Mock API calls
      vi.mocked(apiClient.post)
        .mockResolvedValueOnce({ task_id: mockTaskId }) // Run task
        .mockResolvedValueOnce({} as any); // Create task in DB

      // Mock polling - success on first check
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        status: 'SUCCESS',
        result: mockBase64Image,
      });

      vi.mocked(apiClient.put).mockResolvedValue({} as any);

      const { result } = renderHook(() => useGenerateImage(), {
        wrapper: createWrapper(),
      });

      // Execute mutation
      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify API calls
      expect(imageService.prepareImageData).toHaveBeenCalledWith(mockPayload);
      expect(apiClient.post).toHaveBeenCalledWith(
        'http://0.0.0.0:8000/run_task/',
        {
          server_name: mockTaskRequest.server_name,
          task_name: mockTaskRequest.task_name,
          payload: mockTaskRequest.payload,
        },
      );

      // Verify success notification
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Image generation for Test Avatar completed',
        'success',
        5000,
        {
          avatarId: 'avatar-123',
          taskId: mockTaskId,
          mediaType: 'image',
        },
      );

      // Verify result data
      expect(result.current.data).toEqual({
        avatar: mockPayload.avatar,
        base64Image: mockBase64Image,
        url: 'blob:http://localhost/image',
        filename: 'image.png',
        taskId: mockTaskId,
      });
    });

    it('should handle avatar without name', async () => {
      const mockPayload = {
        avatar: { id: 'avatar-456' },
        positivePrompt: 'Test prompt',
      };

      vi.mocked(imageService.prepareImageData).mockResolvedValue({
        taskRequest: {} as any,
      });

      vi.mocked(apiClient.post).mockResolvedValueOnce({ task_id: 'task-456' });
      vi.mocked(apiClient.post).mockResolvedValueOnce({} as any);

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        status: 'SUCCESS',
        result: 'base64-data',
      });

      vi.mocked(imageService.createImageResponse).mockReturnValue({
        base64Image: 'base64-data',
        taskId: 'task-456',
      } as any);

      const { result } = renderHook(() => useGenerateImage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockShowNotification).toHaveBeenCalledWith(
        'Image generation for Avatar completed',
        'success',
        5000,
        expect.any(Object),
      );
    });
  });

  describe('Polling behavior', () => {
    it('should poll until task succeeds', async () => {
      const mockPayload = {
        avatar: {
          id: '6906545041b4d521c6658eb3',
          name: 'Zara Okafor',
          createdAt: '01/11/2025',
          updatedAt: '01/11/2025',
          description: 'undefined',
          category: 'undefined',
          personality: 'undefined',
          backgroundKnowledge: 'undefined',
          hasEncodedData: false,
          fileName: 'Zara Okafor-original.jpeg',
          src: '/uploads/image/1762022480310-9heb0q.jpeg',
          trainingAudioPath: null,
          trainingAudioFileName: null,
        },
        positivePrompt: 'a tech entrepreneur giving a presentation',
        negativePrompt: 'low quality',
        imageRatio: '1:1',
        imageQuality: 'medium',
        base64Image: null,
        taskName: 'text_to_image',
      };

      vi.mocked(imageService.prepareImageData).mockResolvedValue({
        taskRequest: {} as any,
      });

      vi.mocked(apiClient.post).mockResolvedValueOnce({ task_id: 'task-poll' });
      vi.mocked(apiClient.post).mockResolvedValueOnce({} as any);

      // Mock multiple polling responses: PENDING then SUCCESS
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ status: 'PENDING' })
        .mockResolvedValueOnce({ status: 'SUCCESS', result: 'base64-data' });

      vi.mocked(imageService.createImageResponse).mockReturnValue({
        base64Image: 'base64-data',
        taskId: 'task-poll',
      } as any);

      vi.mocked(apiClient.put).mockResolvedValue({} as any);

      const { result } = renderHook(() => useGenerateImage(), {
        wrapper: createWrapper(),
      });

      const mutationPromise = result.current.mutateAsync(mockPayload);

      await waitFor(() => expect(result.current.isPending).toBe(true));

      await mutationPromise;

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should have polled 2 times (PENDING, then SUCCESS)
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error handling', () => {
    it('should handle task failure', async () => {
      const mockPayload = {
        avatar: { id: 'avatar-error', name: 'Error Avatar' },
        positivePrompt: 'Test',
      };

      vi.mocked(imageService.prepareImageData).mockResolvedValue({
        taskRequest: {} as any,
      });

      vi.mocked(apiClient.post).mockResolvedValueOnce({ task_id: 'task-fail' });
      vi.mocked(apiClient.post).mockResolvedValueOnce({} as any);

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        status: 'FAILURE',
        error: 'Processing failed',
      });

      const { result } = renderHook(() => useGenerateImage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(apiClient.put).toHaveBeenCalledWith('/api/task/task-fail', {
        status: 'FAILURE',
        error: 'Processing failed',
      });

      expect(mockShowNotification).toHaveBeenCalledWith(
        'Image generation failed: Processing failed',
        'error',
        5000,
      );
    });

    it('should handle API errors', async () => {
      const mockPayload = {
        positivePrompt: 'Test',
      };

      vi.mocked(imageService.prepareImageData).mockRejectedValue(
        new Error('API connection failed'),
      );

      const { result } = renderHook(() => useGenerateImage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockPayload as any);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockShowNotification).toHaveBeenCalledWith(
        'Image generation failed: API connection failed',
        'error',
        5000,
      );
    });
  });

  describe('Query invalidation', () => {
    it('should invalidate queries on success', async () => {
      const mockPayload = {
        avatar: { id: 'avatar-invalidate', name: 'Test' },
        positivePrompt: 'Test',
      };

      vi.mocked(imageService.prepareImageData).mockResolvedValue({
        taskRequest: {} as any,
      });

      vi.mocked(apiClient.post).mockResolvedValueOnce({ task_id: 'task-inv' });
      vi.mocked(apiClient.post).mockResolvedValueOnce({} as any);

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        status: 'SUCCESS',
        result: 'base64-data',
      });

      vi.mocked(imageService.createImageResponse).mockReturnValue({
        base64Image: 'base64-data',
        taskId: 'task-inv',
      } as any);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useGenerateImage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should be called twice: once after task creation, once on success
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['tasks', 'image', { avatarId: 'avatar-invalidate' }],
      });
      expect(invalidateSpy).toHaveBeenCalledTimes(2);
    });
  });
});
