import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';

interface AudioPlayerProps {
  audioUrl: string | null;
  audioSource: 'uploaded' | 'selected' | 'generated';
  selectedAudioTaskIndex?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  audioSource,
  selectedAudioTaskIndex,
}) => {
  if (!audioUrl) {
    return null;
  }

  const getAudioLabel = () => {
    switch (audioSource) {
      case 'uploaded':
        return 'Uploaded Audio';
      case 'selected':
        return `Selected Audio: ${selectedAudioTaskIndex ? selectedAudioTaskIndex + 1 : ''}`;
      case 'generated':
        return 'Generated Audio';
      default:
        return 'Audio';
    }
  };

  return (
    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-500/50 rounded-lg">
      <div className="flex items-center space-x-2 mb-2">
        <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
        <span className="text-sm font-medium text-green-700 dark:text-green-300">
          {getAudioLabel()}
        </span>
      </div>
      <audio controls src={audioUrl} className="w-full" preload="metadata">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};
