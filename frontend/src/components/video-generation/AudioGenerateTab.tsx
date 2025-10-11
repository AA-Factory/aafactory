import React from 'react';
import { TbSparkles } from 'react-icons/tb';
import { FiInfo } from 'react-icons/fi';
import { Avatar } from '@/lib/types/avatar';

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
            <option value="avatar">Avatar&apos;s uploaded audio</option>
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
      />
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={onAudioGeneration}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <svg
                  aria-hidden="true"
                  className="text-blue-100 w-4 h-4 me-2 animate-spin fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <TbSparkles className="w-3 h-3" />
                <span>Generate Audio</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
