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
import { ImageTask } from '@/lib/types/tasks';
import { useImageTasks, usePollPendingImageTasks } from '@/lib/api/tasks';
interface ImageGenerationState {
  // image type and avatar
  type: { id: string; label: string } | null;
  avatar: Avatar | null;
  selectedImageTask: ImageTask | null;
  // UI state
  step: number;
}

interface ImageGenerationContextType {
  state: ImageGenerationState;

  // Actions
  setType: (type: { id: string; label: string } | null) => void;
  setAvatar: (avatar: Avatar | null) => void;
  setStep: (step: number) => void;
  canProceedToNextStep: boolean;

  setTask: (task: ImageTask | null) => void;
  // Image tasks (future use)
  tasks: ImageTask[];
  loadingImageTasks?: boolean;
  videoTasksError?: Error | null;
  // refreshImageTasks: () => void;
}

const ImageGenerationContext = createContext<
  ImageGenerationContextType | undefined
>(undefined);

export const ImageGenerationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [state, setState] = useState<ImageGenerationState>({
    type: null,
    avatar: null,
    step: 0,
    selectedImageTask: null,
  });

  const {
    data: tasks = [],
    isLoading: loadingImageTasks,
    error: videoTasksError,
  } = useImageTasks(state.avatar?.id || '');
  const processedImageTasks = useMemo(() => {
    return tasks.map((task) => ({
      ...task,
      // Ensure mediaType is set to 'image'
      mediaType: 'image' as const,
    }));
  }, [tasks]);

  // Update imageTasks in state when fetched
  useEffect(() => {
    setState((prev) => ({ ...prev, tasks: processedImageTasks }));
  }, [state.avatar?.id]);
  // Polling for pending image tasks when an avatar is selected
  const pollPendingImageTasks = usePollPendingImageTasks();

  useEffect(() => {
    if (state.avatar) {
      pollPendingImageTasks.mutate(state.avatar.id);
    }
  }, [state.avatar?.id]);

  const setType = useCallback((type: { id: string; label: string } | null) => {
    setState((prev) => ({ ...prev, type: type }));
  }, []);

  const setAvatar = useCallback((avatar: Avatar | null) => {
    setState((prev) => ({ ...prev, avatar }));
  }, []);

  const setStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const setTask = useCallback((task: ImageTask | null) => {
    setState((prev) => ({ ...prev, selectedImageTask: task }));
  }, []);
  const canProceedToNextStep = useMemo(() => {
    switch (state.step) {
      case 0:
        return !!state.type;
      case 1:
        return !!state.avatar;
      default:
        return false;
    }
  }, [state.step, state.avatar, state.type]);

  const contextValue: ImageGenerationContextType = {
    state,
    setType,
    setAvatar,
    setStep,
    canProceedToNextStep,
    tasks: processedImageTasks,
    loadingImageTasks,
    videoTasksError,
    setTask,
  };

  return (
    <ImageGenerationContext.Provider value={contextValue}>
      {children}
    </ImageGenerationContext.Provider>
  );
};

export const useImageGeneration = (): ImageGenerationContextType => {
  const context = useContext(ImageGenerationContext);
  if (!context) {
    throw new Error(
      'useImageGeneration must be used within an ImageGenerationProvider',
    );
  }
  return context;
};
