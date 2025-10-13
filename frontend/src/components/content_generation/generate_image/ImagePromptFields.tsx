import React from 'react';
import { TbSparkles } from 'react-icons/tb';
import { FiInfo } from 'react-icons/fi';
import { Spinner } from '@/components/ui/Spinner';
import { type ImageRatio, ImageQuality } from '@/lib/types/tasks';
import { IMAGE_QUALITIES, IMAGE_RATIOS } from '@/lib/task/constants';
import { Button } from '@/components/ui/Button';

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
}) => {
  return (
    <div className="space-y-4">
      {/* Positive Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <div className="flex items-center space-x-2">
            <span>
              Positive Prompt <span className="text-red-500">*</span>
            </span>
            <div className="relative group">
              <FiInfo className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Describe what you want in the image
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
              </div>
            </div>
          </div>
        </label>
        <textarea
          value={positivePrompt}
          onChange={(e) => onPositivePromptChange(e.target.value)}
          className="w-full h-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800"
          placeholder="Describe the image you want to generate..."
          maxLength={500}
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {positivePrompt.length}/500 characters
        </span>
      </div>

      {/* Negative Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <div className="flex items-center space-x-2">
            <span>Negative Prompt</span>
            <div className="relative group">
              <FiInfo className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Describe what you don&apos;t want in the image
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
              </div>
            </div>
          </div>
        </label>
        <textarea
          value={negativePrompt}
          onChange={(e) => onNegativePromptChange(e.target.value)}
          className="w-full h-20 p-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image Ratio
            </label>
            <select
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quality
          </label>
          <select
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
          disabled={isGenerating || !positivePrompt.trim()}
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
