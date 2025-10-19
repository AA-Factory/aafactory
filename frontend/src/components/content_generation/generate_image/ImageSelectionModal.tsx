import React from 'react';
import { ImageTask } from '@/lib/types/tasks';
import { HiX } from 'react-icons/hi';

interface ImageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageTasks: ImageTask[];
  onSelectImage: (imageTask: ImageTask) => void;
}

export const ImageSelectionModal: React.FC<ImageSelectionModalProps> = ({
  isOpen,
  onClose,
  imageTasks,
  onSelectImage,
}) => {
  if (!isOpen) return null;

  // Filter only successful image tasks
  const successfulTasks = imageTasks.filter(
    (task) => task.status === 'SUCCESS' && task.filePath,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Select an Image
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <HiX className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {successfulTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No successful images found. Generate some images first!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {successfulTasks.map((task) => (
                <div
                  key={task.taskId}
                  onClick={() => {
                    onSelectImage(task);
                    onClose();
                  }}
                  className="relative cursor-pointer group overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all bg-gray-100 dark:bg-gray-700"
                >
                  <div className="w-full h-48 flex items-center justify-center">
                    <img
                      src={`/api/file/image/${task.fileName}`}
                      alt={task.userPrompt || 'Generated image'}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                      Select
                    </span>
                  </div>
                  {task.userPrompt && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                      <p className="text-white text-xs truncate">
                        {task.userPrompt}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
