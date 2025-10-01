import React from 'react';
import { useVideoGeneration } from '@/contexts/VideoGenerationContext';
import { VideoTask } from '@/lib/types/tasks';

export const VideoGallery: React.FC = () => {
  const { state, selectVideoTask, videoTasks, loadingVideoTasks } =
    useVideoGeneration();
  const handleVideoClick = (task: VideoTask) => {
    if (task.status === 'SUCCESS' && task.filePath) {
      selectVideoTask(task);
    }
  };

  const renderVideoThumbnail = (task: VideoTask) => {
    if (task.status === 'SUCCESS' && task.filePath) {
      return (
        <video
          src={task.filePath}
          className="w-24 h-16 object-cover rounded"
          muted
          preload="metadata"
        />
      );
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
        return 'bg-red-500';
    }
  };

  if (loadingVideoTasks) {
    return (
      <div className="flex items-center space-x-2 min-w-[120px] p-2 justify-center h-full">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Loading videos...
        </span>
      </div>
    );
  }

  if (videoTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No videos generated yet.
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4 overflow-x-auto">
      {videoTasks.map((task) => (
        <button
          key={task.taskId}
          onClick={() => handleVideoClick(task)}
          className={`flex flex-col items-center space-y-1 min-w-[120px] max-w-[140px] p-2 rounded-lg border-2 transition-all ${
            task.status === 'SUCCESS'
              ? state.selectedVideoTask?.taskId === task.taskId
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
              : 'border-gray-200 dark:border-gray-700'
          }`}
          disabled={task.status !== 'SUCCESS'}
        >
          {renderVideoThumbnail(task)}
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
