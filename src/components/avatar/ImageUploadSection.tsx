// src/components/avatar/ImageUploadSection.tsx
import React from 'react';
import { HiUpload } from 'react-icons/hi';

interface Props {
  selectedImage: string | null;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageUploadSection: React.FC<Props> = ({
  selectedImage,
  isDragging,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-4">
        Avatar Image
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {selectedImage ? (
          <div className="space-y-4">
            <img
              src={selectedImage}
              alt="Avatar"
              className="mx-auto h-32 w-32 object-cover rounded-lg"
            />
            <p className="text-gray-600">
              Click to change image or drop new image to decode data
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <HiUpload className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-lg text-gray-600 mb-1">Drop Image Here</p>
              <p className="text-sm text-gray-500">or</p>
              <p className="text-sm text-blue-600 font-medium">Click to Upload</p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};
