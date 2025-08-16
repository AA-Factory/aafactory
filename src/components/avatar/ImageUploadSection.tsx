import React from 'react';
import { HiCamera, HiUpload } from 'react-icons/hi';

interface ImageUploadSectionProps {
  selectedImage: string | null;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  existingImageUrl?: string | null;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  selectedImage,
  isDragging,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  error,
  existingImageUrl
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Avatar Image
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Upload an image or drag and drop (supports decoding form data from steganographic images)
      </p>

      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${isDragging
          ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : selectedImage
            ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700/50'
          }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {selectedImage || existingImageUrl ? (
          <div className="space-y-2">
            <img
              src={selectedImage || existingImageUrl || ''}
              alt="Avatar image"
              className="mx-auto h-24 w-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedImage ? 'Click to change or drag a new image' : 'Current image - click to change or drag a new image'}
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
                <span className="font-medium text-blue-600 dark:text-blue-400">Drop to upload</span>
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