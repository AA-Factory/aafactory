import React from 'react';
import { Label } from '@/components/ui/Label';
import { HiUpload } from 'react-icons/hi';

interface AudioUploadTabProps {
  uploadedAudioFile: File | null;
  onAudioFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AudioUploadTab: React.FC<AudioUploadTabProps> = ({
  uploadedAudioFile,
  onAudioFileUpload,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <HiUpload className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> an audio
              file
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              MP3, WAV, M4A, OGG (MAX. 50MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="audio/*"
            onChange={onAudioFileUpload}
          />
        </label>
      </div>
      {uploadedAudioFile && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Selected: {uploadedAudioFile.name}
        </div>
      )}
    </div>
  );
};
