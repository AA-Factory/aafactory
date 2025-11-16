import React, { useState, useMemo } from 'react';
import { TbSparkles, TbUpload } from 'react-icons/tb';
import { useGenerateAnimation } from '@/hooks/use-generate-animation';
import { useNotification } from '@/contexts/NotificationContext';
import { useVideoGeneration } from '@/contexts/VideoGenerationContext';
import { useVideoTasks } from '@/lib/api/tasks';
import { useFileDragDrop } from '@/hooks/use-file-drag-drop';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';

export const ImageAndVideoToVideoSection: React.FC = () => {
  const { state } = useVideoGeneration();
  const generateAnimationMutation = useGenerateAnimation();
  const { showNotification } = useNotification();
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [existingVideoFilePath, setExistingVideoFilePath] = useState<
    string | null
  >(state.selectedVideoTask?.metadata?.videoPrompt?.filePath || null);

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
      setExistingVideoFilePath(null); // Clear existing video when new file is uploaded
      showNotification(
        `Video file "${file.name}" uploaded successfully.`,
        'success',
      );
    }
  };

  // Handle file selection via drag-drop
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      showNotification('Please upload a valid video file.', 'error');
      return;
    }
    setUploadedVideoFile(file);
    setExistingVideoFilePath(null); // Clear existing video when new file is uploaded
    showNotification(
      `Video file "${file.name}" uploaded successfully.`,
      'success',
    );
  };

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } =
    useFileDragDrop(handleFileSelect, ['video/*']);

  const handleAnimationGeneration = async () => {
    if (!uploadedVideoFile && !existingVideoFilePath) {
      showNotification(
        'Please upload a video file or select an existing video.',
        'error',
      );
      return;
    }
    if (!state.avatar?.id) {
      showNotification('No avatar selected for animation generation.', 'error');
      return;
    }
    if (!state.selectedImageFilePath || !state.selectedImageFileName) {
      showNotification('No image selected for animation generation.', 'error');
      return;
    }
    let videoPrompt: string | File = '';
    if (uploadedVideoFile) {
      videoPrompt = uploadedVideoFile;
    } else if (existingVideoFilePath) {
      videoPrompt = existingVideoFilePath;
    }
    showNotification(
      `Generating ${state.videoType.label} for ${state.avatar?.name}`,
      'info',
    );

    const payload = {
      avatar: state.avatar,
      taskName: state.videoType.id,
      imageFilePath: state.selectedImageFilePath,
      imageFileName: state.selectedImageFileName,
      videoPrompt: videoPrompt,
    };
    generateAnimationMutation.mutate(payload);
  };

  const canGenerate =
    (uploadedVideoFile || existingVideoFilePath) &&
    state.avatar &&
    state.selectedImageFilePath;
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
          <strong>Video:</strong>{' '}
          {uploadedVideoFile
            ? uploadedVideoFile.name
            : existingVideoFilePath
              ? 'From gallery'
              : 'Not uploaded'}
        </li>
      </ul>

      {/* Video Upload */}
      <div className="w-full space-y-3">
        <Label htmlFor="video-upload">Upload Video</Label>

        <label
          htmlFor="video-upload"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500'
          }`}
        >
          <div className="flex flex-col items-center justify-center py-6 px-4">
            {uploadedVideoFile ? (
              <div className="flex flex-col items-center gap-2">
                <video
                  src={URL.createObjectURL(uploadedVideoFile)}
                  className="h-24 w-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center truncate max-w-full">
                  {uploadedVideoFile.name}
                </p>
              </div>
            ) : existingVideoFilePath ? (
              <div className="flex flex-col items-center gap-2">
                <video
                  src={existingVideoFilePath}
                  className="h-24 w-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  From gallery
                </p>
              </div>
            ) : (
              <>
                <TbUpload className="w-10 h-10 mb-3 text-gray-500 dark:text-gray-400" />
                <p className="mb-1 text-sm text-gray-500 dark:text-gray-400 text-center">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Video files (MP4, MOV, etc.)
                </p>
              </>
            )}
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
