import React from 'react';
import { useVideoGeneration } from '@/contexts/VideoGenerationContext';
import { useImageTasks } from '@/lib/api/tasks';
import { Tooltip } from '@/components/ui/Tooltip';

export const AvatarImageSelector: React.FC = () => {
  const { state, setImage } = useVideoGeneration();
  const { data: imageTasks, isLoading } = useImageTasks(state.avatar?.id || '');

  // Create a pseudo-task for the avatar's current image
  const avatarCurrentImage = state.avatar?.src
    ? {
        avatarId: state.avatar.id,
        filePath: state.avatar.src,
        filename: state.avatar.fileName,
      }
    : null;

  const isAvatarImageSelected =
    state.selectedImageFilePath === avatarCurrentImage?.fileName;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <h2 className="text-lg font-bold mb-1 dark:text-white">
          Select Image for Avatar
        </h2>
        <Tooltip text="Choose an image for the generation" />
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 overflow-scroll">
          {/* Avatar's current image option */}
          {avatarCurrentImage && (
            <button
              key="avatar-current"
              onClick={() => {
                setImage(
                  avatarCurrentImage.filePath || null,
                  avatarCurrentImage.filename || null,
                );
              }}
              className={`rounded-lg border-2 flex flex-col items-center p-3 space-y-2 transition-all w-full max-h-fit ${
                isAvatarImageSelected
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
              }`}
            >
              <img
                src={`/api/file/image/${avatarCurrentImage.fileName}`}
                alt="Avatar current image"
                className="w-full h-32 object-cover rounded-md"
              />
              <span className="font-semibold dark:text-white">
                Avatar Current Image
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Use the avatar's set image
              </span>
            </button>
          )}

          {/* Generated image tasks */}
          {imageTasks
            ?.filter((task) => task.filePath !== avatarCurrentImage?.filePath)
            .map((task) => (
              <button
                key={task.taskId}
                onClick={() => {
                  setImage(task.filePath || null, task.fileName || null);
                }}
                className={`rounded-lg border-2 flex flex-col items-center p-3 space-y-2 transition-all w-full max-h-fit ${
                  state.selectedImageFilePath === task.fileName
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                }`}
              >
                <img
                  src={`/api/file/image/${task.fileName || ''}`}
                  alt={`Image Task ${task.taskId}`}
                  className="w-full h-32 object-cover rounded-md"
                />
                <span className="font-semibold dark:text-white">
                  Task ID: {task.taskId}
                </span>
                <span className="text-xs text-gray-500 dark:text-white">
                  Status: {task.status}
                </span>
              </button>
            )) ||
            (!avatarCurrentImage && (
              <p className="text-gray-500 dark:text-gray-400">
                No images available for the selected avatar.
              </p>
            ))}
        </div>
      )}
    </div>
  );
};
