import React from 'react';
import { useVideoGeneration } from '@/contexts/VideoGenerationContext';
import { PromptImageAudioToVideoSection } from './PromptImageAudioToVideoSection';
import { ImageAndVideoToVideoSection } from './ImageAndVideoToVideoSection';

export const VideoSection: React.FC = () => {
  const { state } = useVideoGeneration();

  // Conditionally render based on video type
  if (state.videoType.id === 'prompt_image_audio_to_video') {
    return <PromptImageAudioToVideoSection />;
  } else if (state.videoType.id === 'image_and_video_to_video') {
    return <ImageAndVideoToVideoSection />;
  }

  // Default fallback
  return (
    <div className="flex flex-col items-center space-y-4">
      <p className="text-gray-500 dark:text-gray-400">
        Video type not supported yet.
      </p>
    </div>
  );
};
