import React from 'react';
import { ImagePromptFields } from './ImagePromptFields';
import { type ImageRatio, ImageQuality } from '@/lib/types/tasks';
interface TextToImageTabProps {
  positivePrompt: string;
  onPositivePromptChange: (prompt: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (prompt: string) => void;
  imageRatio: ImageRatio;
  onImageRatioChange: (ratio: ImageRatio) => void;
  imageQuality: ImageQuality;
  onImageQualityChange: (quality: ImageQuality) => void;
  onImageGeneration: () => void;
  isGenerating: boolean;
}

export const TextToImageTab: React.FC<TextToImageTabProps> = ({
  positivePrompt,
  onPositivePromptChange,
  negativePrompt,
  onNegativePromptChange,
  imageRatio,
  onImageRatioChange,
  imageQuality,
  onImageQualityChange,
  onImageGeneration,
  isGenerating,
}) => {
  return (
    <ImagePromptFields
      positivePrompt={positivePrompt}
      onPositivePromptChange={onPositivePromptChange}
      negativePrompt={negativePrompt}
      onNegativePromptChange={onNegativePromptChange}
      imageRatio={imageRatio}
      onImageRatioChange={onImageRatioChange}
      imageQuality={imageQuality}
      onImageQualityChange={onImageQualityChange}
      onImageGeneration={onImageGeneration}
      isGenerating={isGenerating}
      showImageRatio={true}
    />
  );
};
