import React, { useState, useMemo } from 'react';
import { TbSparkles, TbUpload } from 'react-icons/tb';
import { useGenerateAnimation } from '@/hooks/use-generate-animation';
import { useNotification } from '@/contexts/NotificationContext';
import { useVideoGeneration } from '@/contexts/VideoGenerationContext';
import { useVideoTasks } from '@/lib/api/tasks';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';

export const AnimationInputs: React.FC = () => {
  const { state } = useVideoGeneration();
  const generateAnimationMutation = useGenerateAnimation();
  const { showNotification } = useNotification();
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);

  // Fetch video tasks to check pending count
  const { data: videoTasks = [] } = useVideoTasks(
    state.avatar?.id || '',
    'PENDING',
  );

  // Count pending/in-progress tasks
  const pendingTasksCount = useMemo(() => {
    return videoTasks.filter((task) => task.status === 'PENDING').length;
  }, [videoTasks]);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        showNotification('Please upload a valid video file.', 'error');
        return;
      }
      setUploadedVideoFile(file);
      showNotification(`Video file "${file.name}" uploaded successfully.`, 'success');
    }
  };

  const handleAnimationGeneration = async () => {
    if (!uploadedVideoFile) {
      showNotification('Please upload a video file.', 'error');
      return;
    }
    if (!state.avatar?.id) {
      showNotification('No avatar selected for animation generation.', 'error');
      return;
    }
    if (!state.selectedImageFilePath) {
      showNotification('No image selected for animation generation.', 'error');
      return;
    }

    showNotification(
      `Generating ${state.videoType.label} for ${state.avatar?.name}`,
      'info',
    );

    const payload = {
      avatar: state.avatar,
      imageSrc: state.selectedImageFilePath,
      videoFile: uploadedVideoFile,
    };
    generateAnimationMutation.mutate(payload);
  };

  const canGenerate = uploadedVideoFile && state.avatar && state.selectedImageFilePath;
  const isLimitReached = pendingTasksCount >= 5;

  return (
    <div className="flex flex-col items-center space-y-4">
      <h2 className="text-lg font-bold mb-4 dark:text-white">
        Ready to generate animation!
      </h2>

      <ul className="text-left text-gray-700 dark:text-gray-200 space-y-1 text-xs">
        <li>
          <strong>Video type:</strong> {state.videoType.label}
        </li>
        <li>
          <strong>Avatar:</strong> {state.avatar ? state.avatar.name : 'None'}
        </li>
        <li>
          <strong>Image:</strong> {state.selectedImageFileName || 'None'}
        </li>
        <li>
          <strong>Video:</strong> {uploadedVideoFile ? uploadedVideoFile.name : 'Not uploaded'}
        </li>
      </ul>

      {/* Video Upload */}
      <div className="w-full space-y-2">
        <Label htmlFor="video-upload">Upload Video</Label>
        <div className="flex flex-col items-center justify-center w-full">
          <label
            htmlFor="video-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <TbUpload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                {uploadedVideoFile ? (
                  <span className="font-semibold">{uploadedVideoFile.name}</span>
                ) : (
                  <>
                    <span className="font-semibold">Click to upload</span> or drag
                    and drop
                  </>
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Video files (MP4, MOV, etc.)
              </p>
            </div>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoUpload}
            />
          </label>
        </div>
      </div>

      {isLimitReached && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Maximum of 5 videos can be generated at once. Please wait for some to
          complete.
        </p>
      )}

      <Button
        variant="primary"
        onClick={handleAnimationGeneration}
        disabled={
          !canGenerate || generateAnimationMutation.isPending || isLimitReached
        }
        fullWidth
      >
        {generateAnimationMutation.isPending ? (
          <>
            <Spinner />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <TbSparkles className="w-4 h-4" />
            <span>Generate Animation</span>
          </>
        )}
      </Button>
    </div>
  );
};
