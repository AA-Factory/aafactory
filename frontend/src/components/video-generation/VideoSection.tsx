import React, { useState } from "react";
import { TbSparkles } from "react-icons/tb";
import { useAvatars } from "@/hooks/useAvatars";
import { useGenerateVideo } from "@/hooks/useGenerateVideo";
import { useNotification } from "@/contexts/NotificationContext";
import { useVideoGeneration } from "@/contexts/VideoGenerationContext";
import { fileToBase64, encodeMediaFile } from "@/lib/base64Utils";

export const VideoSection: React.FC = () => {
  const { data: avatars } = useAvatars();
  const { state, refreshVideoTasks } = useVideoGeneration();
  const generateVideoMutation = useGenerateVideo();
  const { showNotification } = useNotification();
  const [videoPrompt, setVideoPrompt] = useState('An ultra-realistic video of the avatar speaking the provided dialog, with natural facial expressions and lip-syncing, set against a simple background.');

  const handleVideoGeneration = async () => {
    if (!state.avatar) {
      showNotification("Please select an avatar first.", "error");
      return;
    }

    if (!state.selectedAudioTask && !state.generatedAudioBase64 && !state.uploadedAudioFile) {
      showNotification(
        "Please select an audio generation, generate new audio, or upload an audio file first.",
        "error"
      );
      return;
    }

    showNotification("Generating video, video will be added to the gallery once complete.", "info");

    let audioToUse = state.generatedAudioBase64;

    try {
      if (state.uploadedAudioFile && !audioToUse) {
        audioToUse = await fileToBase64(state.uploadedAudioFile);
      } else if (state.selectedAudioTask && !audioToUse) {
        const result = await encodeMediaFile(state.selectedAudioTask.filePath);
        audioToUse = result.base64;
      }

      if (!audioToUse) {
        showNotification("No audio available for video generation.", "error");
        return;
      }

      generateVideoMutation.mutate(
        {
          avatar: state.avatar,
          audioBase64: audioToUse,
          prompt: videoPrompt,
        },
        {
          onSuccess: (result) => {
            showNotification("Video generated successfully!", "success");
            refreshVideoTasks();
          },
          onError: (error) => {
            console.error("Video generation failed:", error);
            showNotification("Video generation failed. Please try again.", "error");
            refreshVideoTasks();
          },
          onSettled: () => {
            // Always refresh when the mutation settles (success or error)
            // This ensures we catch the pending task that should now be in the DB
            setTimeout(() => {
              refreshVideoTasks();
            }, 2000);
          }
        }
      );

      // Refresh video tasks after a short delay to show the pending task
      setTimeout(() => {
        refreshVideoTasks();
      }, 1500);
    } catch (error) {
      console.error('Error processing audio:', error);
      showNotification("Failed to process audio. Please try again.", "error");
    }
  };
  const getAudioStatus = () => {
    if (state.uploadedAudioFile) return "Uploaded file";
    if (state.selectedAudioTask) return "Selected from previous generation";
    if (state.audioReady) return "Generated";
    return "Not ready";
  };

  const canGenerate = (state.selectedAudioTask || state.uploadedAudioFile || state.audioReady) && state.avatar;

  return (
    <div className="flex flex-col items-center space-y-4">
      <TbSparkles className="w-10 h-10 text-blue-600 dark:text-blue-400" />
      <h2 className="text-lg font-bold mb-4 dark:text-white">Ready to generate!</h2>

      <ul className="text-left text-gray-700 dark:text-gray-200 space-y-1 text-xs">
        <li>
          <strong>Video type:</strong>{" "}
          {state.videoType.label}
        </li>
        <li>
          <strong>Avatar:</strong>{" "}
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
        <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
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
      <button
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center space-x-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleVideoGeneration}
        disabled={!canGenerate || generateVideoMutation.isPending}
      >
        <TbSparkles className="w-4 h-4" />
        <span>
          {generateVideoMutation.isPending ? "Generating Video..." : "Generate Video"}
        </span>
      </button>
    </div>
  );
};