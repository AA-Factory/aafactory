import React, { useState, useEffect, useMemo } from 'react';
import { AudioGenerateTab } from './AudioGenerateTab';
import { AudioUploadTab } from './AudioUploadTab';
import { AudioSelector } from './AudioSelector';
import { AudioPlayer } from './AudioPlayer';
import { useGenerateAudio } from '@/hooks/use-generate-audio';
import { useNotification } from '@/contexts/NotificationContext';
import { useVideoGeneration } from '@/contexts/VideoGenerationContext';
import { useAudioTasks } from '@/lib/api/tasks';
import { AudioTask } from '@/lib/types/tasks';
import { getRandomSeed } from '@/utils/fakeData';
import { MIN_AUDIO_DURATION } from '@/lib/task/constants';

export const AudioSection: React.FC = () => {
  const { state, setAudioData } = useVideoGeneration();
  const [audioTab, setAudioTab] = useState<'generate' | 'upload'>('generate');
  const [selectedAudioSource, setSelectedAudioSource] = useState<
    'avatar' | 'rick_and_morty' | 'japanese'
  >('avatar');
  const [dialog, setDialog] = useState(getRandomSeed('dialog'));
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [selectedAudioTask, setSelectedAudioTask] = useState<AudioTask | null>(
    null,
  );
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(
    null,
  );
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<
    string | null
  >(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);

  const generateAudioMutation = useGenerateAudio();

  const { showNotification } = useNotification();
  const { data: audioTasks = [], isLoading: loadingAudioTasks } = useAudioTasks(
    state.avatar?.id || '',
    'SUCCESS',
  );

  // Memoize audioTasks to prevent unnecessary re-renders
  const memoizedAudioTasks = useMemo(() => audioTasks, [audioTasks.length]);

  // Clear audio selections when avatar changes
  useEffect(() => {
    if (!state.avatar?.id) {
      setSelectedAudioTask(null);
    }
  }, [state.avatar?.id]);
  // Auto-select avatar audio source if available when avatar changes
  useEffect(() => {
    if (state.avatar?.trainingAudioPath) {
      setSelectedAudioSource('avatar');
    }
  }, [state.avatar?.id, state.avatar?.trainingAudioPath]);

  // Initialize from context state (only once)
  useEffect(() => {
    if (
      !isInitialized &&
      state.selectedAudioTask &&
      memoizedAudioTasks.length > 0
    ) {
      // Check if the context task exists in available tasks
      const contextTask = memoizedAudioTasks.find(
        (task) => task.taskId === state.selectedAudioTask?.taskId,
      );
      if (contextTask) {
        setSelectedAudioTask(contextTask);
        setDialog(
          contextTask.metadata?.taskInfo?.dialog || getRandomSeed('dialog'),
        );
      }
      setIsInitialized(true);
    } else if (!isInitialized && memoizedAudioTasks.length > 0) {
      setIsInitialized(true);
    }
  }, [state.selectedAudioTask, memoizedAudioTasks, isInitialized]);

  // Update context whenever audio-related state changes
  useEffect(() => {
    const hasAudio = !!(
      selectedAudioTask ||
      generatedAudioBase64 ||
      uploadedAudioFile
    );
    const isAudioValid =
      audioDuration !== null && audioDuration >= MIN_AUDIO_DURATION;
    const isReady = dialog.trim().length > 0 && hasAudio && isAudioValid;

    setAudioData({
      selectedAudioTask,
      generatedAudioBase64,
      uploadedAudioFile,
      dialog,
      audioReady: isReady,
    });
  }, [
    selectedAudioTask,
    generatedAudioBase64,
    uploadedAudioFile,
    dialog,
    audioDuration,
  ]);

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const url = file ? URL.createObjectURL(file) : null;
    setUploadedAudioFile(file);
    setUploadedAudioUrl(url);

    // Clear other audio sources when uploading
    if (file) {
      setSelectedAudioTask(null);
      setGeneratedAudioUrl(null);
      setGeneratedAudioBase64(null);
      setDialog('** Uploaded Audio **');
    }
  };

  const handleAudioGeneration = async () => {
    showNotification(`Generating audio for ${state.avatar?.name}`, 'info');

    const payload = {
      avatar: state.avatar,
      taskName: state.videoType.id,
      dialog: dialog,
      audioSource: selectedAudioSource,
    };
    generateAudioMutation.mutate(payload, {
      onSuccess: (audioResponse) => {
        setGeneratedAudioBase64(audioResponse.base64Audio);
        setGeneratedAudioUrl(audioResponse.audioUrl);
        setSelectedAudioTask(null);
        setUploadedAudioFile(null);
        setUploadedAudioUrl(null);
      },
    });
  };

  const handleAudioTaskSelect = (taskId: string) => {
    if (taskId === 'generated') {
      // Select generated audio, clear task selection
      setSelectedAudioTask(null);
    } else if (taskId === 'null') {
      // Clear all audio selections
      clearAllAudioSelections();
    } else {
      // Select a specific audio task
      const task = memoizedAudioTasks.find((t) => t.taskId === taskId);
      if (task) {
        setSelectedAudioTask(task);
        // Clear other audio sources when selecting a task
        setGeneratedAudioUrl(null);
        setGeneratedAudioBase64(null);
        setUploadedAudioFile(null);
        setUploadedAudioUrl(null);
      }
    }
  };

  const clearAllAudioSelections = () => {
    setSelectedAudioTask(null);
    setGeneratedAudioUrl(null);
    setGeneratedAudioBase64(null);
    setUploadedAudioFile(null);
    setUploadedAudioUrl(null);
  };

  const getAudioPlayerProps = () => {
    // Priority order: uploaded > selected task > generated
    if (uploadedAudioUrl) {
      return {
        audioUrl: uploadedAudioUrl,
        audioSource: 'uploaded' as const,
        uploadedFileName: uploadedAudioFile?.name,
      };
    }

    if (selectedAudioTask) {
      return {
        audioUrl: selectedAudioTask.filePath,
        audioSource: 'selected' as const,
        selectedAudioTaskIndex: memoizedAudioTasks.findIndex(
          (task) => task.taskId === selectedAudioTask.taskId,
        ),
      };
    }

    if (generatedAudioUrl) {
      return {
        audioUrl: generatedAudioUrl,
        audioSource: 'generated' as const,
      };
    }

    return null;
  };

  const audioPlayerProps = getAudioPlayerProps();

  return (
    <div className="space-y-6">
      {/* Audio Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setAudioTab('generate')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              audioTab === 'generate'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Generate Audio
          </button>
          <button
            onClick={() => setAudioTab('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              audioTab === 'upload'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Upload Audio
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {audioTab === 'generate' ? (
        <AudioGenerateTab
          avatar={state.avatar}
          selectedAudioSource={selectedAudioSource}
          onAudioSourceChange={setSelectedAudioSource}
          dialog={dialog}
          onDialogChange={setDialog}
          onAudioGeneration={handleAudioGeneration}
          isGenerating={generateAudioMutation.isPending}
        />
      ) : (
        <AudioUploadTab
          uploadedAudioFile={uploadedAudioFile}
          onAudioFileUpload={handleAudioFileUpload}
        />
      )}

      {/* Audio Selection */}
      <AudioSelector
        availableAudioTasks={memoizedAudioTasks}
        selectedAudioTask={selectedAudioTask}
        generatedAudioUrl={generatedAudioUrl}
        onAudioTaskSelect={handleAudioTaskSelect}
        loadingAudioTasks={loadingAudioTasks}
      />

      {/* Audio Player */}
      {audioPlayerProps && (
        <AudioPlayer
          {...audioPlayerProps}
          onDurationChange={setAudioDuration}
        />
      )}
    </div>
  );
};
