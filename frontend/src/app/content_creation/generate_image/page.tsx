'use client';
import React from 'react';
import { PiFileImageBold } from 'react-icons/pi';
import { AvatarSelector } from '@/components/content_generation/AvatarSelector';
import { GenerationTypeSelector } from '@/components/content_generation/GenerationTypeSelector';
import { ImageSection } from '@/components/content_generation/generate_image/ImageSection';
import { GenerationGallery } from '@/components/content_generation/GenerationGallery';
import { MediaViewer } from '@/components/content_generation/MediaViewer';
import { MediaActionButton } from '@/components/content_generation/MediaActionButton';
import { GenerationTemplate } from '@/components/content_generation/GenerationTemplate';
import {
  ImageGenerationProvider,
  useImageGeneration,
} from '@/contexts/ImageGenerationContext';
import { useUpdateAvatar } from '@/hooks/use-avatars';
import { useNotification } from '@/contexts/NotificationContext';

import { IMAGE_TYPES } from '@/lib/task/constants';

function GenerateImageContent() {
  const {
    state,
    setStep,
    setAvatar,
    setType,
    setTask,
    tasks,
    loadingImageTasks,
  } = useImageGeneration();
  const updateAvatarMutation = useUpdateAvatar();
  const { showNotification } = useNotification();

  const displayTask = state.selectedImageTask?.filePath
    ? state.selectedImageTask
    : tasks[0];

  const getFileName = () => {
    if (!displayTask?.filePath) return 'No image selected';
    return displayTask.filePath.split('/').pop() || 'No image selected';
  };

  const setAvatarDefaultImg = async (
    imgUrl: string,
    avatarId: string,
    fileName: string,
  ) => {
    try {
      await updateAvatarMutation.mutateAsync(
        {
          id: avatarId,
          src: imgUrl,
          fileName: fileName,
        },
        {
          onSuccess: () => {
            showNotification('Avatar image updated successfully!');
          },
        },
      );
    } catch (error) {
      console.error('Error updating avatar image:', error);
      showNotification('Failed to update avatar image. Please try again.');
    }
  };

  const steps = [
    {
      label: 'Select image type',
      content: (
        <GenerationTypeSelector
          state={state}
          setType={setType}
          types={IMAGE_TYPES}
          title="Select image type"
          tooltip="Choose the type of image generation you want to perform"
          icon={PiFileImageBold}
        />
      ),
      canNext: !!state.type,
    },
    {
      label: 'Select avatar',
      content: (
        <AvatarSelector
          selectedAvatar={state.avatar}
          setAvatar={setAvatar}
          tooltip="Choose an avatar to use for image generation"
        />
      ),
      canNext: !!state.avatar,
    },
    {
      label: 'Generate image',
      content: <ImageSection />,
      canNext: false,
    },
  ];

  return (
    <GenerationTemplate
      steps={steps}
      currentStep={state.step}
      onStepChange={setStep}
      viewerComponent={
        <MediaViewer
          type="image"
          src={displayTask?.filePath}
          alt="Generated"
          fileName={getFileName()}
          showDownload={true}
          aspectRatio="image"
          actions={
            state.avatar && displayTask?.filePath ? (
              <MediaActionButton
                onClick={() =>
                  setAvatarDefaultImg(
                    displayTask.filePath!,
                    state.avatar!.id.toString(),
                    getFileName(),
                  )
                }
                variant="primary"
                size="sm"
              >
                Set as Avatar Image
              </MediaActionButton>
            ) : undefined
          }
          maxWidth="max-w-md"
        />
      }
      galleryComponent={
        <GenerationGallery
          tasks={tasks}
          selectedTask={state.selectedImageTask}
          onTaskSelect={setTask}
          loading={loadingImageTasks}
          emptyMessage="No images generated yet."
          mediaType="image"
        />
      }
    />
  );
}

export default function GenerateImage() {
  return (
    <ImageGenerationProvider>
      <GenerateImageContent />
    </ImageGenerationProvider>
  );
}
