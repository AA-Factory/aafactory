import React, { useState } from 'react';
import { HiUpload } from 'react-icons/hi';
import { ImagePromptFields } from './ImagePromptFields';
import { type ImageRatio, ImageQuality, ImageTask } from '@/lib/types/tasks';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { useFileDragDrop } from '@/hooks/use-file-drag-drop';

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
  selectedImageTask?: ImageTask | null;
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
  selectedImageTask,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter only successful image tasks
  const successfulTasks = imageTasks.filter(
    (task) => task.status === 'SUCCESS' && task.filePath,
  );

  // Handle file selection via drag-drop
  const handleFileSelect = (file: File) => {
    const event = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    onImageFileUpload(event);
  };

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } =
    useFileDragDrop(handleFileSelect, ['image/*']);

  return (
    <div className="space-y-4">
      {/* Image Upload Section */}
      <div className="space-y-3">
        <Label htmlFor="imageUpload">Source Image</Label>

        <label
          htmlFor="imageUpload"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500'
          }`}
        >
          <div className="flex flex-col items-center justify-center py-6 px-4">
            {uploadedImageFile ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={URL.createObjectURL(uploadedImageFile)}
                  alt="Uploaded"
                  className="h-24 w-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center truncate max-w-full">
                  {uploadedImageFile.name}
                </p>
              </div>
            ) : selectedImageTask?.metadata?.imagePrompt?.filePath ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={selectedImageTask.metadata.imagePrompt.filePath}
                  alt="Previously generated"
                  className="h-24 w-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  From gallery
                </p>
              </div>
            ) : (
              <>
                <HiUpload className="w-10 h-10 mb-3 text-gray-500 dark:text-gray-400" />
                <p className="mb-1 text-sm text-gray-500 dark:text-gray-400 text-center">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
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
        readyToGenerate={!!uploadedImageFile || !!selectedImageTask}
      />

      {/* Image Selection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select an Image"
        maxHeight="max-h-[80vh]"
        contentClassName="dark:bg-gray-800"
      >
        {successfulTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No successful images found. Generate some images first!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {successfulTasks.map((task) => (
              <div
                key={task.taskId}
                onClick={() => {
                  if (onSelectExistingImage) {
                    onSelectExistingImage(task);
                  }
                  setIsModalOpen(false);
                }}
                className="relative cursor-pointer group overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all bg-gray-100 dark:bg-gray-700"
              >
                <div className="w-full h-48 flex items-center justify-center">
                  <img
                    src={task.filePath}
                    alt={'Generated image'}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                    Select
                  </span>
                </div>
                {task.metadata?.taskInfo?.positivePrompt && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                    <p className="text-white text-xs truncate">
                      {task.metadata.taskInfo.positivePrompt}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
