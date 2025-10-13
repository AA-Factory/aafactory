import React from 'react';
import { useImageGeneration } from '@/contexts/ImageGenerationContext';
import { useUpdateAvatar } from '@/hooks/useAvatars';
import { useNotification } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/Button';

export const ImageViewer: React.FC = () => {
  const { state, tasks } = useImageGeneration();
  const updateAvatarMutation = useUpdateAvatar();
  const { showNotification } = useNotification();

  // Determine which task to display
  const displayTask = state.selectedImageTask?.filePath
    ? state.selectedImageTask
    : tasks[0];

  // Early return if no task with image
  if (!displayTask?.filePath) {
    return null;
  }

  // Extract filename from path
  const getFileName = () => {
    return displayTask.filePath!.split('/').pop() || 'No image selected';
  };
  const setAvatarDefaultImg = async (
    imgUrl: string,
    avatarId: string,
    fileName: string,
  ) => {
    try {
      await updateAvatarMutation.mutateAsync({
        id: avatarId,
        src: imgUrl,
        fileName: fileName,
      });
      showNotification('Avatar image updated successfully!');
    } catch (error) {
      console.error('Error updating avatar image:', error);
      showNotification('Failed to update avatar image. Please try again.');
    }
  };
  // Get download filename
  const getDownloadName = () => {
    const fileName =
      displayTask.fileName ||
      displayTask.metadata?.resultData?.fileName ||
      Date.now();
    return `generated-image-${fileName}.png`;
  };

  return (
    <div className="w-md max-w-max aspect-square bg-black rounded-xl shadow-lg flex items-center justify-center relative">
      <span className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10">
        {getFileName()}
      </span>

      <div className="relative w-full h-full">
        <img
          key={displayTask.taskId}
          src={displayTask.filePath}
          alt="Generated"
          className="w-full h-full rounded-xl object-contain bg-black"
        />
        <div className="flex justify-center space-x-2 mt-2">
          <a
            href={displayTask.filePath}
            download={getDownloadName()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
          >
            Download
          </a>
          {state.avatar && (
            <Button
              onClick={() =>
                setAvatarDefaultImg(
                  displayTask.filePath!,
                  state.avatar!.id.toString(),
                  getFileName(),
                )
              }
              variant="primary"
              size="sm"
            >
              Set as Avatar Image
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
