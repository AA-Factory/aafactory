import React, { useState } from 'react';
import { HiUpload } from 'react-icons/hi';
import { ImagePromptFields } from './ImagePromptFields';
import { type ImageRatio, ImageQuality, ImageTask } from '@/lib/types/tasks';
import { ImageSelectionModal } from './ImageSelectionModal';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';

interface ImageToImageTabProps {
  uploadedImageFile: File | null;
  onImageFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  imageTasks?: ImageTask[];
  onSelectExistingImage?: (imageTask: ImageTask) => void;
}

export const ImageToImageTab: React.FC<ImageToImageTabProps> = ({
  uploadedImageFile,
  onImageFileUpload,
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
  imageTasks = [],
  onSelectExistingImage,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Image Upload Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="imageUpload">Source Image</Label>
        </div>

        <div className="flex flex-col items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploadedImageFile ? (
                <img
                  src={
                    uploadedImageFile
                      ? URL.createObjectURL(uploadedImageFile)
                      : '/upload-placeholder.png'
                  }
                  alt="Upload"
                  className="mx-auto h-24 w-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                />
              ) : (
                <>
                  <HiUpload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> an
                    image file
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, JPEG, WEBP (MAX. 10MB)
                  </p>
                </>
              )}
            </div>
            <input
              id="imageUpload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onImageFileUpload}
            />
          </label>
        </div>

        {uploadedImageFile && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Selected: {uploadedImageFile.name}
          </div>
        )}
        {onSelectExistingImage && (
          <Button
            type="button"
            onClick={() => setIsModalOpen(true)}
            variant="info"
            size="sm"
            fullWidth={true}
          >
            Choose from existing images
          </Button>
        )}
      </div>

      {/* Prompt Fields - No Image Ratio for image-to-image */}
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
        showImageRatio={false}
      />

      {/* Image Selection Modal */}
      <ImageSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageTasks={imageTasks}
        onSelectImage={(task) => {
          if (onSelectExistingImage) {
            onSelectExistingImage(task);
          }
        }}
      />
    </div>
  );
};
