import React from 'react';
import { VideoTask, ImageTask } from '@/lib/types/tasks';
import {
  ImageGenerationProvider,
  useImageGeneration,
} from '@/contexts/ImageGenerationContext';

// You might want to create a more generic type or extend VideoTask
type MediaTask = VideoTask | ImageTask;
interface GenerationGalleryProps {
  loading?: boolean;
  emptyMessage?: string;
  mediaType?: 'image' | 'video';
}

export const GenerationGallery: React.FC<GenerationGalleryProps> = ({
  loading = false,
  emptyMessage = 'No media generated yet.',
}) => {
  const { state, tasks, loadingImageTasks, setTask } = useImageGeneration();
  const handleMediaClick = (task: ImageTask) => {
    if (task.status === 'SUCCESS' && task.filePath) {
      setTask(task);
    }
  };

  const getMediaType = (task: ImageTask): 'image' | 'video' => {
    // Check explicit mediaType if available
    if (task.taskType) {
      return task.taskType;
    }

    // Otherwise, infer from file extension
    if (task.filePath) {
      const ext = task.filePath.split('.').pop()?.toLowerCase();
      const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

      if (videoExtensions.includes(ext || '')) {
        return 'video';
      }
      if (imageExtensions.includes(ext || '')) {
        return 'image';
      }
    }

    // Default to image
    return 'image';
  };

  const renderMediaThumbnail = (task: ImageTask) => {
    if (task.status === 'SUCCESS' && task.filePath) {
      const mediaType = getMediaType(task);

      if (mediaType === 'video') {
        return (
          <video
            src={task.filePath}
            className="w-24 h-16 object-cover rounded"
            muted
            preload="metadata"
          />
        );
      } else {
        return (
          <img
            src={task.filePath}
            alt="Media thumbnail"
            className="w-24 h-16 object-cover rounded"
          />
        );
      }
    }

    return (
      <div className="w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
        {task.status === 'PENDING' && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        )}
        {task.status === 'FAILURE' && (
          <span className="text-xs text-red-500">Failed</span>
        )}
      </div>
    );
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-500';
      case 'PENDING':
        return 'bg-yellow-500';
      case 'FAILURE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loadingImageTasks || loading) {
    return (
      <div className="flex items-center space-x-2 min-w-[120px] p-2 justify-center h-full">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Loading media...
        </span>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4 overflow-x-auto">
      {tasks.map((task) => (
        <button
          key={task.taskId}
          onClick={() => handleMediaClick(task)}
          className={`flex flex-col items-center space-y-1 min-w-[120px] max-w-[140px] p-2 rounded-lg border-2 transition-all ${
            task.status === 'SUCCESS'
              ? state.selectedImageTask?.taskId === task.taskId
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
              : 'border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60'
          }`}
          disabled={task.status !== 'SUCCESS'}
        >
          {renderMediaThumbnail(task)}
          <div className="text-center w-full">
            <span
              className={`text-xs px-1 py-0.5 rounded text-white ${getStatusBadgeColor(task.status)}`}
            >
              {task.status}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};
