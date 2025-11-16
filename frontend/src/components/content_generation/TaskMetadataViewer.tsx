import React from 'react';
import { FiClock, FiUser, FiInfo, FiSettings } from 'react-icons/fi';
import {
  TaskDocument,
  VideoTask,
  ImageTask,
  AudioTask,
} from '@/lib/types/tasks';

interface TaskMetadataViewerProps {
  task?: TaskDocument | VideoTask | ImageTask | AudioTask | null;
}

export const TaskMetadataViewer: React.FC<TaskMetadataViewerProps> = ({
  task,
}) => {
  if (!task || !task.metadata) {
    return null;
  }

  const { metadata } = task;
  const taskInfo = metadata.taskInfo;
  const avatarName = 'avatarName' in metadata ? metadata.avatarName : undefined;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const calculateDuration = (start?: string, finish?: string) => {
    if (!start || !finish) return 'N/A';
    try {
      const startTime = new Date(start).getTime();
      const finishTime = new Date(finish).getTime();
      const duration = Math.round((finishTime - startTime) / 1000);

      if (duration < 60) return `${duration}s`;
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}m ${seconds}s`;
    } catch {
      return 'N/A';
    }
  };

  const formatLabel = (key: string) => {
    // Convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getMetadataEntries = () => {
    if (!taskInfo) return [];

    const excludedKeys = ['startTime', 'finishTime'];
    return Object.entries(taskInfo)
      .filter(([key]) => !excludedKeys.includes(key))
      .filter(
        ([, value]) => value !== null && value !== undefined && value !== '',
      );
  };

  return (
    <div className="w-full bg-whitebg-opacity-50 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <FiInfo className="w-5 h-5" />
        Task Information
      </h3>

      {/* Avatar Name */}
      {avatarName && (
        <div className="flex items-start gap-3">
          <FiUser className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Avatar
            </p>
            <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
              {avatarName}
            </p>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 flex-shrink-0 mt-0.5">
          <div
            className={`w-3 h-3 rounded-full ${
              task.status === 'SUCCESS'
                ? 'bg-green-500'
                : task.status === 'PENDING'
                  ? 'bg-yellow-500'
                  : task.status === 'FAILURE'
                    ? 'bg-red-500'
                    : 'bg-gray-500'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Status
          </p>
          <p className="text-sm text-gray-900 dark:text-white font-medium">
            {task.status}
          </p>
        </div>
      </div>

      {/* Generation Duration */}
      {taskInfo?.startTime && taskInfo?.finishTime && (
        <div className="flex items-start gap-3">
          <FiClock className="w-5 h-5 text-purple-500 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Generation Duration
            </p>
            <p className="text-sm text-gray-900 dark:text-white font-medium">
              {calculateDuration(taskInfo.startTime, taskInfo.finishTime)}
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Metadata Rendering */}
      {getMetadataEntries().map(([key, value]) => (
        <div key={key} className="flex items-start gap-3">
          <FiSettings className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {formatLabel(key)}
            </p>
            <p className="text-sm text-gray-900 dark:text-white break-words whitespace-pre-wrap">
              {formatValue(value)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
