import React, { useState } from 'react';
import { TbSparkles } from 'react-icons/tb';
import { useGenerateVideo } from '@/hooks/use-generate-video';
import { useNotification } from '@/contexts/NotificationContext';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Label } from '@/components/ui/Label';
import { type VideoAspectRatio } from '@/lib/types/tasks';
import { useVideoGeneration } from '@/contexts/VideoGenerationContext';

const ASPECT_RATIOS: { value: VideoAspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1 (Square)' },
  { value: '2:3', label: '2:3 (Portrait)' },
  { value: '3:2', label: '3:2 (Landscape)' },
];

export const TextToVideoInputs: React.FC = () => {
  const generateVideoMutation = useGenerateVideo();
  const { showNotification } = useNotification();
  const { state } = useVideoGeneration();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('1:1');

  const handleVideoGeneration = async () => {
    if (!prompt.trim()) {
      showNotification('Please enter a prompt for video generation.', 'error');
      return;
    }

    showNotification('Generating text-to-video', 'info');

    const payload = {
      avatar: state.avatar,
      textToVideo: true,
      prompt: prompt.trim(),
      aspectRatio: aspectRatio,
    };

    generateVideoMutation.mutate(payload);
  };

  const canGenerate = prompt.trim().length > 0;

  return (
    <div className="flex flex-col items-center space-y-4">
      <h2 className="text-lg font-bold mb-4 dark:text-white">
        Text to Video Generation
      </h2>

      {/* Prompt Input */}
      <div className="w-full space-y-2">
        <Label htmlFor="text-to-video-prompt">Prompt</Label>
        <TextArea
          id="text-to-video-prompt"
          value={prompt}
          className="max-w-xs w-full"
          onChange={setPrompt}
          placeholder="Describe the video you want to generate..."
          rows={5}
        />
      </div>

      {/* Aspect Ratio Selection */}
      <div className="w-full space-y-2">
        <Label
          htmlFor="aspect-ratio"
          tooltipText="Select the aspect ratio for your video"
        >
          Aspect Ratio
        </Label>
        <select
          id="aspect-ratio"
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {ASPECT_RATIOS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Button
        variant="primary"
        onClick={handleVideoGeneration}
        disabled={!canGenerate || generateVideoMutation.isPending}
        fullWidth
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
