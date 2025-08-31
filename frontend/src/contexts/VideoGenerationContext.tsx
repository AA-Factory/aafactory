"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Avatar } from "@/types/avatar";
import { VideoTask } from "@/types/tasks";
import { fetchVideoTasks, pollPendingVideoTasks } from "@/lib/api/tasks";
import { DIALOG_SEEDS } from "@/utils/fakeData";
import { VIDEO_TYPES } from "@/config/constants";
interface AudioTask {
  taskId: string;
  userPrompt: string;
  filePath: string;
}
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
  videoTasks: VideoTask[];
  generatedVideoUrl: string | null;
  selectedVideoTask: VideoTask | null;
  loadingVideoTasks: boolean;

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


  // Computed values
  canProceedToNextStep: boolean;
}

const VideoGenerationContext = createContext<VideoGenerationContextType | undefined>(undefined);

const getRandomDialogSeed = () => {
  return DIALOG_SEEDS[Math.floor(Math.random() * DIALOG_SEEDS.length)];
};

export const VideoGenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [state, setState] = useState<VideoGenerationState>({
    videoType: VIDEO_TYPES[0],
    avatar: null,
    selectedAudioTask: null,
    generatedAudioBase64: null,
    uploadedAudioFile: null,
    dialog: getRandomDialogSeed(),
    audioReady: false,
    videoTasks: [],
    generatedVideoUrl: null,
    selectedVideoTask: null,
    loadingVideoTasks: false,
    step: 0,
  });

  // Fetch video tasks when avatar changes
  useEffect(() => {
    if (state.avatar?.id) {
      setState(prev => ({ ...prev, loadingVideoTasks: true }));
      fetchVideoTasks(state.avatar.id)
        .then(tasks => {
          setState(prev => ({
            ...prev,
            videoTasks: tasks.map(task => ({
              ...task,
              filePath: task.filePath ?? "",
            })),
          }));
        })
        .finally(() => {
          setState(prev => ({ ...prev, loadingVideoTasks: false }));
        });
    } else {
      setState(prev => ({ ...prev, videoTasks: [] }));
    }
  }, [state.avatar?.id, state.generatedVideoUrl]);

  const setVideoType = useCallback((type: { id: string; label: string }) => {
    setState(prev => ({ ...prev, videoType: type }));
  }, []);

  const setAvatar = useCallback((avatar: Avatar | null) => {
    setState(prev => ({ ...prev, avatar }));
  }, []);

  const setStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const setAudioData = useCallback((audioData: {
    selectedAudioTask: AudioTask | null;
    generatedAudioBase64: string | null;
    uploadedAudioFile: File | null;
    dialog: string;
    audioReady: boolean;
  }) => {
    setState(prev => ({
      ...prev,
      selectedAudioTask: audioData.selectedAudioTask,
      generatedAudioBase64: audioData.generatedAudioBase64,
      uploadedAudioFile: audioData.uploadedAudioFile,
      dialog: audioData.dialog,
      audioReady: audioData.audioReady,
    }));
  }, []);

  const refreshVideoTasks = useCallback(() => {
    if (state.avatar?.id) {
      pollPendingVideoTasks(state.avatar.id)
      setState(prev => ({ ...prev, loadingVideoTasks: true }));
      fetchVideoTasks(state.avatar.id)
        .then(tasks => {
          setState(prev => ({
            ...prev,
            videoTasks: tasks.map(task => ({
              ...task,
              filePath: task.filePath ?? "",
            })),
          }));
        })
        .finally(() => {
          setState(prev => ({ ...prev, loadingVideoTasks: false }));
        });
    }
  }, [state.avatar?.id]);

  const selectVideoTask = useCallback((task: VideoTask | null) => {
    setState(prev => ({ ...prev, selectedVideoTask: task }));
  }, []);


  // Computed values
  const canProceedToNextStep = (() => {
    switch (state.step) {
      case 0: // Video type selection
        return true;
      case 1: // Avatar selection
        return !!state.avatar;
      case 2: // Audio generation
        return state.audioReady;
      case 3: // Video generation
        return false;
      default:
        return false;
    }
  })();

  const contextValue: VideoGenerationContextType = {
    state,
    setVideoType,
    setAvatar,
    setStep,
    setAudioData,
    refreshVideoTasks,
    selectVideoTask,
    canProceedToNextStep,
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
    throw new Error('useVideoGeneration must be used within a VideoGenerationProvider');
  }
  return context;
};