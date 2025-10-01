import React from 'react';
import { FiInfo } from 'react-icons/fi';

interface AudioTask {
  taskId: string;
  userPrompt: string;
  filePath: string;
}

interface AudioSelectorProps {
  availableAudioTasks: AudioTask[];
  selectedAudioTask: AudioTask | null;
  generatedAudioUrl: string | null;
  onAudioTaskSelect: (taskId: string) => void;
  loadingAudioTasks: boolean;
}

export const AudioSelector: React.FC<AudioSelectorProps> = ({
  availableAudioTasks,
  selectedAudioTask,
  generatedAudioUrl,
  onAudioTaskSelect,
  loadingAudioTasks,
}) => {
  // if (availableAudioTasks.length === 0 && !generatedAudioUrl) {
  //   return null;
  // }

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <div className="flex items-center space-x-2">
          <span>Select Audio For Video Generation</span>
          <div className="relative group">
            <FiInfo className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Select audio to be used for video generation either the latest
              generation or previous generations
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
            </div>
          </div>
        </div>
      </label>
      <select
        name="audioTask"
        value={
          selectedAudioTask?.taskId ||
          (generatedAudioUrl && !selectedAudioTask ? 'generated' : '')
        }
        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 text-sm  disabled:opacity-50 disabled:cursor-not-allowed"
        onChange={(e) => onAudioTaskSelect(e.target.value)}
        disabled={
          (availableAudioTasks.length === 0 && !generatedAudioUrl) ||
          loadingAudioTasks
        }
      >
        <option value="null">Select an audio generation</option>
        {generatedAudioUrl && (
          <option value="generated">Generated Audio (Current)</option>
        )}
        {availableAudioTasks.map((task, index) => (
          <option key={task.taskId} value={task.taskId}>
            {index + 1}. "{task.userPrompt || 'Audio Generation'}"
          </option>
        ))}
      </select>
    </div>
  );
};
