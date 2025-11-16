import React from 'react';
import { TbSparkles } from 'react-icons/tb';
import { Spinner } from '@/components/ui/Spinner';
import { type ImageRatio, ImageQuality } from '@/lib/types/tasks';
import { IMAGE_QUALITIES, IMAGE_RATIOS } from '@/lib/task/constants';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Label } from '@/components/ui/Label';

interface ImagePromptFieldsProps {
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
  showImageRatio?: boolean;
  readyToGenerate: boolean;
}

export const ImagePromptFields: React.FC<ImagePromptFieldsProps> = ({
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
  showImageRatio = true,
  readyToGenerate,
}) => {
  return (
    <div className="space-y-4">
      {/* Positive Prompt */}
      <div>
        <Label
          htmlFor="positivePrompt"
          className="mb-2"
          tooltipText="Describe the image you want to generate"
          required
        >
          Positive Prompt
        </Label>
        <TextArea
          id="positivePrompt"
          value={positivePrompt}
          onChange={onPositivePromptChange}
          className="w-full h-24"
          placeholder="Describe the image you want to generate..."
          maxLength={500}
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {positivePrompt.length}/500 characters
        </span>
      </div>

      {/* Negative Prompt */}
      <div>
        <Label
          htmlFor="negativePrompt"
          className="mb-2"
          tooltipText="Describe what you don't want in the image"
        >
          Negative Prompt
        </Label>
        <TextArea
          id="negativePrompt"
          value={negativePrompt}
          onChange={onNegativePromptChange}
          className="w-full h-20"
          placeholder="Describe what you don't want..."
          maxLength={300}
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {negativePrompt.length}/300 characters
        </span>
      </div>

      {/* Image Ratio and Quality */}
      <div
        className={`grid ${showImageRatio ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}
      >
        {showImageRatio && (
          <div>
            <Label
              htmlFor="imageRatio"
              className="mb-2"
              tooltipText="Select the image aspect ratio"
            >
              Image Ratio
            </Label>
            <select
              id="imageRatio"
              value={imageRatio}
              onChange={(e) => onImageRatioChange(e.target.value as ImageRatio)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 text-sm"
            >
              {IMAGE_RATIOS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <Label
            htmlFor="imageQuality"
            className="mb-2"
            tooltipText="Select the quality of the generated image"
          >
            Quality
          </Label>
          <select
            id="imageQuality"
            value={imageQuality}
            onChange={(e) =>
              onImageQualityChange(e.target.value as ImageQuality)
            }
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 text-sm"
          >
            {IMAGE_QUALITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button
          onClick={onImageGeneration}
          variant="primary"
          size="sm"
          fullWidth
          disabled={isGenerating || !positivePrompt.trim() || !readyToGenerate}
        >
          {isGenerating ? (
            <>
              <Spinner />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <TbSparkles className="w-3 h-3" />
              <span>Generate Image</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
