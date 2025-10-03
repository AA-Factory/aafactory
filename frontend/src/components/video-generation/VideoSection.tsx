import React, { useState, useMemo } from 'react';
import { TbSparkles } from 'react-icons/tb';
import { useQueryClient } from '@tanstack/react-query';
import { useAvatars } from '@/hooks/useAvatars';
import { useGenerateVideo } from '@/hooks/useGenerateVideo';
import { useNotification } from '@/contexts/NotificationContext';
import { useVideoGeneration } from '@/contexts/VideoGenerationContext';
import { useVideoTasks } from '@/lib/api/tasks';
import { fileToBase64, encodeMediaFile } from '@/lib/base64Utils';

export const VideoSection: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: avatars } = useAvatars();
  const { state } = useVideoGeneration();

  const generateVideoMutation = useGenerateVideo();

  const { showNotification } = useNotification();
  const [videoPrompt, setVideoPrompt] = useState(
    'An ultra-realistic video of the avatar speaking the provided dialog, with natural facial expressions and lip-syncing, set against a simple background.',
  );

  // Fetch video tasks to check pending count
  const { data: videoTasks = [] } = useVideoTasks(
    state.avatar?.id || '',
    'PENDING',
  );

  // Count pending/in-progress tasks
  const pendingTasksCount = useMemo(() => {
    return videoTasks.filter((task) => task.status === 'PENDING').length;
  }, [videoTasks]);

  // Handle task status updates
  // useEffect(() => {
  //   if (taskStatus.data) {
  //     showNotification("Video generation completed! Check the gallery.", "success");
  //     // Invalidate video tasks query to refresh the list
  //     queryClient.invalidateQueries({
  //       queryKey: ["tasks", "video", { avatarId: state.avatar?.id }]
  //     });
  //     setTaskId(null); // Clear taskId after completion
  //   }
  // }, [taskStatus.data, queryClient, state.avatar?.id]);

  const handleVideoGeneration = async () => {
    if (!state.avatar) {
      showNotification('Please select an avatar first.', 'error');
      return;
    }

    if (
      !state.selectedAudioTask &&
      !state.generatedAudioBase64 &&
      !state.uploadedAudioFile
    ) {
      showNotification(
        'Please select an audio generation, generate new audio, or upload an audio file first.',
        'error',
      );
      return;
    }

    if (pendingTasksCount >= 5) {
      showNotification(
        'Maximum of 5 videos can be generated at once. Please wait for some to complete.',
        'error',
      );
      return;
    }

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
      const payload = {
        avatar: state.avatar,
        audioBase64: audioToUse,
        prompt: videoPrompt,
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

      {isLimitReached && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Maximum of 5 videos can be generated at once. Please wait for some to
          complete.
        </p>
      )}

      <button
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center space-x-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleVideoGeneration}
        disabled={
          !canGenerate || generateVideoMutation.isPending || isLimitReached
        }
      >
        <TbSparkles className="w-4 h-4" />
        <span>
          {generateVideoMutation.isPending
            ? 'Generating Video...'
            : 'Generate Video'}
        </span>
      </button>
    </div>
  );
};
