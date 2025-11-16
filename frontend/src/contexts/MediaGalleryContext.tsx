'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Avatar } from '@/lib/types/avatar';
import { AudioTask, VideoTask, ImageTask } from '@/lib/types/tasks';
import { useAudioTasks, useVideoTasks, useImageTasks } from '@/lib/api/tasks';
import { useActiveAvatars } from './ActiveAvatarsContext';

type Task = AudioTask | VideoTask | ImageTask;

interface MediaGalleryState {
  avatar: Avatar | null;
  type: {
    id: string;
    label: string;
    disabled?: boolean;
    aspectRatio?: string;
    viewerSize?: string;
  } | null;
  selectedTask: Task | null;
  step: number;
}

interface MediaGalleryContextType {
  state: MediaGalleryState;

  // Actions
  setAvatar: (avatar: Avatar | null) => void;
  setType: (type: { id: string; label: string } | null) => void;
  setTask: (task: Task | null) => void;
  setStep: (step: number) => void;

  // Tasks for the selected avatar and media type
  tasks: Task[];
  loadingTasks: boolean;
  tasksError: Error | null;
}

const MediaGalleryContext = createContext<MediaGalleryContextType | undefined>(
  undefined,
);

export const MediaGalleryProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [state, setState] = useState<MediaGalleryState>({
    avatar: null,
    type: null,
    selectedTask: null,
    step: 0,
  });

  // Fetch tasks based on avatar and media type
  const {
    data: audioTasks = [],
    isLoading: loadingAudioTasks,
    error: audioTasksError,
  } = useAudioTasks(state.avatar?.id || '', 'SUCCESS');

  const {
    data: videoTasks = [],
    isLoading: loadingVideoTasks,
    error: videoTasksError,
  } = useVideoTasks(state.avatar?.id || '', 'SUCCESS');

  const {
    data: imageTasks = [],
    isLoading: loadingImageTasks,
    error: imageTasksError,
  } = useImageTasks(state.avatar?.id || '', 'SUCCESS');

  const { setGlobalTask, setGlobalAvatar } = useActiveAvatars();
  useActiveAvatars();

  // Determine which tasks to show based on media type
  const tasks = (() => {
    if (!state.type || !state.avatar) return [];

    switch (state.type?.id) {
      case 'audio':
        return audioTasks;
      case 'video':
        return videoTasks;
      case 'image':
        return imageTasks;
      default:
        return [];
    }
  })();

  // Determine loading state
  const loadingTasks = (() => {
    if (!state.type || !state.avatar) return false;

    switch (state.type.id) {
      case 'audio':
        return loadingAudioTasks;
      case 'video':
        return loadingVideoTasks;
      case 'image':
        return loadingImageTasks;
      default:
        return false;
    }
  })();

  // Determine error state
  const tasksError = (() => {
    if (!state.type) return null;

    switch (state.type.id) {
      case 'audio':
        return audioTasksError;
      case 'video':
        return videoTasksError;
      case 'image':
        return imageTasksError;
      default:
        return null;
    }
  })();

  const setAvatar = useCallback((avatar: Avatar | null) => {
    setGlobalAvatar(avatar);
    setState((prev) => ({ ...prev, avatar, selectedTask: null }));
  }, []);

  const setType = useCallback((type: { id: string; label: string } | null) => {
    setState((prev) => ({ ...prev, type, selectedTask: null }));
  }, []);

  const setTask = useCallback((task: Task | null) => {
    setGlobalTask(task);
    setState((prev) => ({ ...prev, selectedTask: task }));
  }, []);

  const setStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const contextValue: MediaGalleryContextType = {
    state,
    setAvatar,
    setType,
    setTask,
    setStep,
    tasks,
    loadingTasks,
    tasksError,
  };

  return (
    <MediaGalleryContext.Provider value={contextValue}>
      {children}
    </MediaGalleryContext.Provider>
  );
};

export const useMediaGallery = (): MediaGalleryContextType => {
  const context = useContext(MediaGalleryContext);
  if (!context) {
    throw new Error(
      'useMediaGallery must be used within a MediaGalleryProvider',
    );
  }
  return context;
};
