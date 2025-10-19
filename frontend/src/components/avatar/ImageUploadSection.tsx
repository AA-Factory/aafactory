import React, { useCallback } from 'react';
import { HiCamera, HiUpload } from 'react-icons/hi';
import { useFileDragDrop } from '@/hooks/use-file-drag-drop';
import { Label } from '@/components/ui/Label';

interface ImageUploadSectionProps {
  register: (name: 'image') => Record<string, unknown>;
  selectedImage: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  existingImageUrl?: string | null;
  fileSelect: (file: File) => void;
  editMode: boolean;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  register,
  selectedImage,
  fileInputRef,
  onFileSelect,
  error,
  existingImageUrl,
  fileSelect,
  editMode,
}) => {
  const handleFileSelect = useCallback(
    (file: File) => {
      fileSelect(file);
    },
    [fileSelect],
  );

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } =
    useFileDragDrop(handleFileSelect, ['image/*']);
  const getImageSrc = () => {
    if (editMode && !selectedImage) {
      return `/api/file/image/${existingImageUrl}`;
    } else {
      return selectedImage || existingImageUrl || undefined;
    }
  };
  return (
    <div className="mb-3">
      <Label htmlFor="image">Avatar Image</Label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Upload an image for the avatar (optional), If none is provided a default
        will be used
      </p>

      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragging
            ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : selectedImage
              ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          {...register('image')}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {selectedImage || existingImageUrl ? (
          <div className="space-y-2">
            <img
              src={getImageSrc() || ''}
              alt="Avatar image"
              className="mx-auto h-24 w-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedImage
                ? 'Click to change or drag a new image'
                : 'Current image - click to change or drag a new image'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500">
              {isDragging ? (
                <HiUpload className="h-full w-full" />
              ) : (
                <HiCamera className="h-full w-full" />
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {isDragging ? (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  Drop to upload
                </span>
              ) : (
                <>
                  <span className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
          <span className="text-xs">{error}</span>
        </div>
      )}
    </div>
  );
};
