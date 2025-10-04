import React from 'react';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { MIN_AUDIO_DURATION } from '@/lib/task/constants';
interface AudioPlayerProps {
  audioUrl: string | null;
  audioSource: 'uploaded' | 'selected' | 'generated';
  selectedAudioTaskIndex?: number;
  onDurationChange?: (duration: number) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  audioSource,
  selectedAudioTaskIndex,
  onDurationChange,
}) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [audioDuration, setAudioDuration] = React.useState<number | null>(null);
  const [isValid, setIsValid] = React.useState<boolean>(true);

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

  const handleLoadedMetadata = () => {
    const duration = audioRef.current?.duration;
    if (duration) {
      setAudioDuration(duration);
      const valid = duration >= MIN_AUDIO_DURATION;
      setIsValid(valid);
      onDurationChange?.(duration);
    }
  };

  const borderColor = isValid
    ? 'border-green-200 dark:border-green-500/50'
    : 'border-red-200 dark:border-red-500/50';
  const bgColor = isValid
    ? 'bg-green-50 dark:bg-green-900/30'
    : 'bg-red-50 dark:bg-red-900/30';

  return (
    <div className={`mt-4 p-3 ${bgColor} border ${borderColor} rounded-lg`}>
      <div className="flex items-center space-x-2 mb-2">
        {isValid ? (
          <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
        ) : (
          <FiAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
        )}
        <span
          className={`text-sm font-medium ${
            isValid
              ? 'text-green-700 dark:text-green-300'
              : 'text-red-700 dark:text-red-300'
          }`}
        >
          {getAudioLabel()}
          {audioDuration !== null && (
            <span className="ml-2">({audioDuration.toFixed(2)}s)</span>
          )}
        </span>
      </div>
      {!isValid && audioDuration !== null && (
        <div className="mb-2 text-xs text-red-600 dark:text-red-400">
          Audio must be at least {MIN_AUDIO_DURATION} seconds long. Current
          duration: {audioDuration.toFixed(2)}s
        </div>
      )}
      <audio
        ref={audioRef}
        controls
        src={audioUrl}
        className="w-full"
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};
