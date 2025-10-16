'use client';
import React from 'react';
import { PiFileImageBold } from 'react-icons/pi';
// Import components
import { AvatarSelector } from '@/components/content_generation/AvatarSelector';
import { GenerationTypeSelector } from '@/components/content_generation/GenerationTypeSelector';
import { ImageSection } from '@/components/content_generation/generate_image/ImageSection';
import { GenerationGallery } from '@/components/content_generation/GenerationGallery';
import { ImageViewer } from '@/components/content_generation/generate_image/ImageViewer';
import { GenerationTemplate } from '@/components/templates/GenerationTemplate';
// Import context
import {
  ImageGenerationProvider,
  useImageGeneration,
} from '@/contexts/ImageGenerationContext';

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

  const steps = [
    {
      label: 'Select image type',
      content: (
        <GenerationTypeSelector
          state={state}
          setType={setType}
          types={IMAGE_TYPES}
          title="Select image type"
          icon={PiFileImageBold}
        />
      ),
      canNext: !!state.type,
    },
    {
      label: 'Select avatar',
      content: <AvatarSelector state={state} setAvatar={setAvatar} />,
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
      viewerComponent={<ImageViewer />}
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
