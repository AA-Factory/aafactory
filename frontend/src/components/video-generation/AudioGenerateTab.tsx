import React from 'react';
import { TbSparkles } from 'react-icons/tb';
import { FiInfo } from 'react-icons/fi';
import { Avatar } from '@/types/avatar';

interface AudioGenerateTabProps {
  avatar: Avatar | null;
  selectedAudioSource: 'avatar' | 'rick_and_morty' | 'japanese';
  onAudioSourceChange: (
    source: 'avatar' | 'rick_and_morty' | 'japanese',
  ) => void;
  dialog: string;
  onDialogChange: (dialog: string) => void;
  onAudioGeneration: () => void;
  isGenerating: boolean;
}

export const AudioGenerateTab: React.FC<AudioGenerateTabProps> = ({
  avatar,
  selectedAudioSource,
  onAudioSourceChange,
  dialog,
  onDialogChange,
  onAudioGeneration,
  isGenerating,
}) => {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <div className="flex items-center space-x-2">
            <span>Training Audio Source</span>
            <div className="relative group">
              <FiInfo className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Choose the voice training audio for speech generation
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
              </div>
            </div>
          </div>
        </label>
        <select
          name="audioSource"
          value={selectedAudioSource}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 text-sm"
          onChange={(e) =>
            onAudioSourceChange(
              e.target.value as 'avatar' | 'rick_and_morty' | 'japanese',
            )
          }
        >
          {avatar?.trainingAudioPath && (
            <option value="avatar">Avatar's uploaded audio</option>
          )}
          <option value="rick_and_morty">Rick and Morty (default)</option>
          <option value="japanese">Japanese Voice</option>
        </select>
      </div>

      <textarea
        name="dialog"
        value={dialog}
        className="w-full h-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800"
        onChange={(e) => onDialogChange(e.target.value)}
        placeholder="Type the dialog for your video here..."
        maxLength={500}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {dialog.length}/500 characters
        </span>
        <div className="flex space-x-2">
          <button
            onClick={onAudioGeneration}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            disabled={isGenerating}
          >
            <TbSparkles className="w-3 h-3" />
            <span>Generate Audio</span>
          </button>
        </div>
      </div>
    </>
  );
};
