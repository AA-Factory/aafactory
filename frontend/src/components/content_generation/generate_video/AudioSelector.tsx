import React from 'react';
import { FiInfo } from 'react-icons/fi';
import { AudioTask } from '@/lib/types/tasks';
import { Tooltip } from '@/components/ui/Tooltip';
import { Label } from '@/components/ui/Label';

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
  return (
    <div className="mt-4">
      <Label
        htmlFor="audioTask"
        className="mb-2"
        tooltipText="Choose from previously generated audio tasks or use the current generated audio"
      >
        Select Audio For Video Generation
      </Label>
      <select
        id="audioTask"
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
