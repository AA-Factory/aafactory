import React, { useState, useMemo } from 'react';
import { TbSparkles } from 'react-icons/tb';
import { useQueryClient } from '@tanstack/react-query';
import { useAvatars } from '@/hooks/useAvatars';
import { useGenerateVideo } from '@/hooks/useGenerateVideo';
import { useNotification } from '@/contexts/NotificationContext';
import { useVideoGeneration } from '@/contexts/VideoGenerationContext';
import { useVideoTasks } from '@/lib/api/tasks';
import { fileToBase64, encodeMediaFile } from '@/lib/base64Utils';
import { Spinner } from '../ui/Spinner';
import { Button } from '@/components/ui/Button';
import { type VideoGenerationConfig } from '@/lib/types/tasks';

export const VideoSection: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: avatars } = useAvatars();
  const { state } = useVideoGeneration();

  const generateVideoMutation = useGenerateVideo();

  const { showNotification } = useNotification();
  const [videoPrompt, setVideoPrompt] = useState(
    'An ultra-realistic video of the avatar speaking the provided dialog, with natural facial expressions and lip-syncing, set against a simple background.',
  );
  const [config, setConfig] = useState<VideoGenerationConfig>('6_steps');
  const [lowVram, setLowVram] = useState(true);

  // Fetch video tasks to check pending count
  const { data: videoTasks = [] } = useVideoTasks(
    state.avatar?.id || '',
    'PENDING',
  );

  // Count pending/in-progress tasks
  const pendingTasksCount = useMemo(() => {
    return videoTasks.filter((task) => task.status === 'PENDING').length;
  }, [videoTasks]);

  const handleVideoGeneration = async () => {
    showNotification(
      'Generating video, video will be added to the gallery once complete.',
      'info',
    );

    let audioToUse = state.generatedAudioBase64;

    try {
      if (state.uploadedAudioFile && !audioToUse) {
        audioToUse = await fileToBase64(state.uploadedAudioFile);
      } else if (state.selectedAudioTask && !audioToUse) {
        const result = await encodeMediaFile(state.selectedAudioTask.filePath);
        audioToUse = result.base64;
      }

      if (!audioToUse) {
        showNotification('No audio available for video generation.', 'error');
        return;
      }
      if (!state.avatar?.id) {
        showNotification('No avatar selected for video generation.', 'error');
        return;
      }
      const payload = {
        avatarId: state.avatar.id,
        imageSrc: state.selectedImageFilePath,
        audioBase64: audioToUse,
        prompt: videoPrompt,
        config: config,
        lowVram: lowVram,
      };
      generateVideoMutation.mutate(payload, {
        onSuccess: (videoResponse) => {
          showNotification('Video generation started', 'info');
          // Invalidate video tasks to refresh the list
          queryClient.invalidateQueries({
            queryKey: ['tasks', 'video', { avatarId: state.avatar?.id }],
          });
        },
      });
    } catch (error) {
      console.error('Error processing audio:', error);
      showNotification('Failed to process audio. Please try again.', 'error');
    }
  };
  const getAudioStatus = () => {
    if (state.uploadedAudioFile) return 'Uploaded file';
    if (state.selectedAudioTask) return 'Selected from previous generation';
    if (state.audioReady) return 'Generated';
    return 'Not ready';
  };

  const canGenerate =
    (state.selectedAudioTask || state.uploadedAudioFile || state.audioReady) &&
    state.avatar;
  const isLimitReached = pendingTasksCount >= 5;

  return (
    <div className="flex flex-col items-center space-y-4">
      <TbSparkles className="w-10 h-10 text-blue-600 dark:text-blue-400" />
      <h2 className="text-lg font-bold mb-4 dark:text-white">
        Ready to generate!
      </h2>

      <ul className="text-left text-gray-700 dark:text-gray-200 space-y-1 text-xs">
        <li>
          <strong>Video type:</strong> {state.videoType.label}
        </li>
        <li>
          <strong>Avatar:</strong>{' '}
          {avatars?.find((a) => a.id === state.avatar?.id)?.name}
        </li>
        <li>
          <strong>Dialog:</strong> {state.dialog}
        </li>
        <li>
          <strong>Audio:</strong> {getAudioStatus()}
        </li>
      </ul>

      {/* Video Prompt Input */}
      <div className="w-full space-y-2">
        <label
          htmlFor="video-prompt"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Video Prompt
        </label>
        <textarea
          id="video-prompt"
          value={videoPrompt}
          onChange={(e) => setVideoPrompt(e.target.value)}
          placeholder="Describe how you want the video to look..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          rows={3}
        />
      </div>

      {/* Config Selection */}
      <div className="w-full space-y-2">
        <label
          htmlFor="config"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Config
        </label>
        <select
          id="config"
          value={config}
          onChange={(e) => setConfig(e.target.value as VideoGenerationConfig)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="6_steps">6 steps</option>
          <option value="8_steps">8 steps</option>
          <option value="high_quality">High quality</option>
          <option value="medium_quality">Medium quality</option>
          <option value="quantize_model">Quantize model</option>
        </select>
      </div>

      {/* Low VRAM Checkbox */}
      <div className="w-full flex items-center space-x-2">
        <input
          id="low-vram"
          type="checkbox"
          checked={lowVram}
          onChange={(e) => setLowVram(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <label
          htmlFor="low-vram"
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Low VRAM
        </label>
      </div>

      {isLimitReached && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Maximum of 5 videos can be generated at once. Please wait for some to
          complete.
        </p>
      )}

      <Button
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center space-x-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleVideoGeneration}
        disabled={
          !canGenerate || generateVideoMutation.isPending || isLimitReached
        }
      >
        {generateVideoMutation.isPending ? (
          <>
            <Spinner />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <TbSparkles className="w-4 h-4" />
            <span>Generate Video</span>
          </>
        )}
      </Button>
    </div>
  );
};
