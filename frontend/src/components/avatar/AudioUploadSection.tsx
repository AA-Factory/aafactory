import React from "react";
import { HiMicrophone, HiUpload } from "react-icons/hi";

interface AudioUploadSectionProps {
  selectedAudio: File | null;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  existingAudioUrl?: string | null;
  existingAudioFileName?: string | null;
}

export const AudioUploadSection: React.FC<AudioUploadSectionProps> = ({
  selectedAudio,
  isDragging,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  error,
  existingAudioUrl,
  existingAudioFileName,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Training Audio
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Upload audio samples for voice training (optional)
      </p>

      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragging
            ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : selectedAudio
              ? "border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700/50"
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={onFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {selectedAudio ? (
          <div className="space-y-2">
            <div className="mx-auto h-12 w-12 text-green-500 dark:text-green-400">
              <HiMicrophone className="h-full w-full" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedAudio.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(selectedAudio.size / (1024 * 1024)).toFixed(2)} MB - Click to change or drag a new file
            </p>
            <audio
              controls
              className="mx-auto max-w-full"
              src={URL.createObjectURL(selectedAudio)}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        ) : existingAudioUrl ? (
          <div className="space-y-2">
            <div className="mx-auto h-12 w-12 text-blue-500 dark:text-blue-400">
              <HiMicrophone className="h-full w-full" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {existingAudioFileName || 'Existing training audio'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Current audio - Click to change or drag a new file
            </p>
            <audio
              controls
              className="mx-auto max-w-full"
              src={existingAudioUrl}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500">
              {isDragging ? (
                <HiUpload className="h-full w-full" />
              ) : (
                <HiMicrophone className="h-full w-full" />
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
                  </span>{" "}
                  or drag and drop
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              MP3, WAV, M4A, OGG up to 50MB
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