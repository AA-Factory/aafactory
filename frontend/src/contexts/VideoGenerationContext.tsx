'use client';
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { Avatar } from '@/lib/types/avatar';
import { VideoTask, AudioTask, ImageTask } from '@/lib/types/tasks';
import {
  useVideoTasks,
  usePollPendingVideoTasks,
  usePollPendingAudioTasks,
} from '@/lib/api/tasks';
import { DIALOG_SEEDS } from '@/utils/fakeData';
import { VIDEO_TYPES } from '@/lib/task/constants';
interface VideoGenerationState {
  // video type and avatar
  videoType: {
    id: string;
    label: string;
  };
  avatar: Avatar | null;

  // Audio data
  selectedAudioTask: AudioTask | null;
  generatedAudioBase64: string | null;
  uploadedAudioFile: File | null;
  dialog: string;
  audioReady: boolean;

  // video data
  generatedVideoUrl: string | null;
  selectedVideoTask: VideoTask | null;

  selectedImageFilePath: string | null;
  // UI state
  step: number;
}

interface VideoGenerationContextType {
  state: VideoGenerationState;

  // Actions
  setVideoType: (type: { id: string; label: string }) => void;
  setAvatar: (avatar: Avatar | null) => void;
  setStep: (step: number) => void;

  // Audio actions
  setAudioData: (audioData: {
    selectedAudioTask: AudioTask | null;
    generatedAudioBase64: string | null;
    uploadedAudioFile: File | null;
    dialog: string;
    audioReady: boolean;
  }) => void;

  // video actions
  refreshVideoTasks: () => void;
  selectVideoTask: (task: VideoTask | null) => void;

  // Video data from React Query
  videoTasks: VideoTask[];
  loadingVideoTasks: boolean;
  videoTasksError: Error | null;

  // Image file path is a url string
  setImageFilePath: (filePath: string | null) => void;
}

const VideoGenerationContext = createContext<
  VideoGenerationContextType | undefined
>(undefined);

const getRandomDialogSeed = () => {
  return DIALOG_SEEDS[Math.floor(Math.random() * DIALOG_SEEDS.length)];
};

export const VideoGenerationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [state, setState] = useState<VideoGenerationState>({
    videoType: VIDEO_TYPES[0],
    avatar: null,
    selectedAudioTask: null,
    generatedAudioBase64: null,
    uploadedAudioFile: null,
    dialog: getRandomDialogSeed(),
    audioReady: false,
    generatedVideoUrl: null,
    selectedVideoTask: null,
    step: 0,
    selectedImageFilePath: null,
  });

  // React Query hooks for video tasks
  const {
    data: videoTasks = [],
    isLoading: loadingVideoTasks,
    error: videoTasksError,
  } = useVideoTasks(state.avatar?.id || '');

  const pollPendingVideoTasksMutation = usePollPendingVideoTasks();
  const pollPendingAudioTasksMutation = usePollPendingAudioTasks();
  // Process video tasks with default filePath
  const processedVideoTasks = useMemo(() => {
    return videoTasks.map((task) => ({
      ...task,
      filePath: task.filePath ?? '',
    }));
  }, [videoTasks]);

  // Poll pending video tasks when avatar changes
  useEffect(() => {
    if (state.avatar?.id) {
      pollPendingVideoTasksMutation.mutate(state.avatar.id);
      pollPendingAudioTasksMutation.mutate(state.avatar.id);
    }
  }, [state.avatar?.id]);

  const setVideoType = useCallback((type: { id: string; label: string }) => {
    setState((prev) => ({ ...prev, videoType: type }));
  }, []);

  const setAvatar = useCallback((avatar: Avatar | null) => {
    setState((prev) => ({ ...prev, avatar }));
  }, []);

  const setStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const setImageFilePath = useCallback((filePath: string | null) => {
    setState((prev) => ({ ...prev, selectedImageFilePath: filePath }));
  }, []);

  const setAudioData = useCallback(
    (audioData: {
      selectedAudioTask: AudioTask | null;
      generatedAudioBase64: string | null;
      uploadedAudioFile: File | null;
      dialog: string;
      audioReady: boolean;
    }) => {
      setState((prev) => ({
        ...prev,
        selectedAudioTask: audioData.selectedAudioTask,
        generatedAudioBase64: audioData.generatedAudioBase64,
        uploadedAudioFile: audioData.uploadedAudioFile,
        dialog: audioData.dialog,
        audioReady: audioData.audioReady,
      }));
    },
    [],
  );

  const refreshVideoTasks = useCallback(() => {
    if (state.avatar?.id) {
      pollPendingVideoTasksMutation.mutate(state.avatar.id);
    }
  }, [state.avatar?.id, pollPendingVideoTasksMutation]);

  const selectVideoTask = useCallback((task: VideoTask | null) => {
    setState((prev) => ({ ...prev, selectedVideoTask: task }));
  }, []);

  const contextValue: VideoGenerationContextType = {
    state,
    setVideoType,
    setAvatar,
    setStep,
    setAudioData,
    refreshVideoTasks,
    selectVideoTask,
    videoTasks: processedVideoTasks,
    loadingVideoTasks,
    videoTasksError,
    setImageFilePath,
  };

  return (
    <VideoGenerationContext.Provider value={contextValue}>
      {children}
    </VideoGenerationContext.Provider>
  );
};

export const useVideoGeneration = () => {
  const context = useContext(VideoGenerationContext);
  if (context === undefined) {
    throw new Error(
      'useVideoGeneration must be used within a VideoGenerationProvider',
    );
  }
  return context;
};
