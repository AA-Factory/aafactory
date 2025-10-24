'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { PiFileImageBold } from 'react-icons/pi';

import { AvatarSelector } from '@/components/content_generation/AvatarSelector';
import { GenerationTypeSelector } from '@/components/content_generation/GenerationTypeSelector';
import { GenerationGallery } from '@/components/content_generation/GenerationGallery';
import { MediaViewer } from '@/components/content_generation/MediaViewer';
import { GenerationTemplate } from '@/components/content_generation/GenerationTemplate';
import { GALLERY_MEDIA_TYPES } from '@/lib/task/constants';
import {
  MediaGalleryProvider,
  useMediaGallery,
} from '@/contexts/MediaGalleryContext';
import { useAvatars } from '@/hooks/use-avatars';
import { Avatar } from '@/lib/types/avatar';

function GalleryPageContent() {
  const searchParams = useSearchParams();
  const { state, setStep, setAvatar, setType, setTask, tasks, loadingTasks } =
    useMediaGallery();
  const { data: avatars = [] } = useAvatars();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Load URL parameters and set initial state
  useEffect(() => {
    if (!avatars.length) return;

    const avatarId = searchParams.get('avatarId');
    const mediaType = searchParams.get('mediaType');

    if (avatarId) {
      const avatar = avatars.find((a: Avatar) => a.id === avatarId);
      if (avatar) {
        setAvatar(avatar);
        setStep(0);

        if (mediaType) {
          const type = GALLERY_MEDIA_TYPES.find((t) => t.id === mediaType);
          if (type) {
            setType(type);
            setStep(1);
          }
        }
      }
    }

    setHasInitialized(true);
  }, [avatars, searchParams, setAvatar, setType, setStep]);

  // When tasks load and we have a taskId in URL, select that task
  useEffect(() => {
    if (!hasInitialized || !tasks.length) return;

    const taskId = searchParams.get('taskId');
    if (taskId) {
      const task = tasks.find((t) => t.taskId === taskId);
      if (task) {
        setTask(task);
      }
    }
  }, [tasks, searchParams, hasInitialized, setTask]);
  const steps = [
    {
      label: 'Select avatar',
      content: (
        <AvatarSelector
          selectedAvatar={state.avatar}
          setAvatar={setAvatar}
          tooltip="Choose an avatar to view its generated media"
        />
      ),
      canNext: !!state.avatar,
    },
    {
      label: 'Select media type',
      content: (
        <GenerationTypeSelector
          state={state}
          setType={setType}
          types={GALLERY_MEDIA_TYPES}
          title="Select Media Type"
          tooltip="Choose the type of media you want to view in the gallery"
          icon={PiFileImageBold}
        />
      ),
      canNext: !!state.type,
    },
  ];

  return (
    <GenerationTemplate
      steps={steps}
      currentStep={state.step}
      onStepChange={setStep}
      viewerComponent={
        <MediaViewer
          type={
            (state.type?.id as 'image' | 'video' | 'audio' | undefined) ||
            'image'
          }
          src={state.selectedTask?.filePath || ''}
          fileName={state.selectedTask?.fileName}
          showDownload={true}
          aspectRatio={
            (state.type?.id as 'image' | 'video' | 'audio' | undefined) ||
            'image'
          }
          maxWidth={`max-w-${state.type?.viewerSize || 'md'}`}
        />
      }
      galleryComponent={
        <GenerationGallery
          tasks={tasks}
          selectedTask={state.selectedTask}
          onTaskSelect={setTask}
          loading={loadingTasks}
          emptyMessage="No media generated yet."
          mediaType={
            (state.type?.id as 'image' | 'video' | 'audio' | undefined) ||
            'image'
          }
        />
      }
    />
  );
}

export default function GalleryPage() {
  return (
    <MediaGalleryProvider>
      <GalleryPageContent />
    </MediaGalleryProvider>
  );
}
