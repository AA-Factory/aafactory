import React from 'react';
import { useVideoGeneration } from '@/contexts/VideoGenerationContext';
import { TalkingHeadInputs } from './TalkingHeadInputs';
import { AnimationInputs } from './AnimationInputs';
import { TextToVideoInputs } from './TextToVideoInputs';
export const VideoSection: React.FC = () => {
  const { state } = useVideoGeneration();

  // Conditionally render based on video type
  if (state.videoType.id === 'talking_head') {
    return <TalkingHeadInputs />;
  } else if (state.videoType.id === 'image_to_animated') {
    return <AnimationInputs />;
  } else if (state.videoType.id === 'text_to_video') {
    return <TextToVideoInputs />;
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
