'use client';
import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { useUpdateAvatar, useAvatars } from '@/hooks/use-avatars';
import { useNotification } from '@/contexts/NotificationContext';
import { useActiveAvatars } from '@/contexts/ActiveAvatarsContext';
import { IMAGE_TYPES } from '@/lib/task/constants';

function GenerateImageContent() {
  const searchParams = useSearchParams();
  const {
    state,
    setStep,
    setAvatar,
    setType,
    setTask,
    tasks,
    loadingImageTasks,
  } = useImageGeneration();
  // const { data: avatars } = useAvatars();
  const updateAvatarMutation = useUpdateAvatar();
  const { showNotification } = useNotification();
  const { globalTask, globalAvatar } = useActiveAvatars();
  //create filtered tasks where the taskname should match the state.type.id
  const filteredTasks = tasks.filter((task) => task.taskName === state.type.id);
  // Initialize state from URL params
  useEffect(() => {
    const step = searchParams.get('step');
    const avatarId = searchParams.get('avatarId');
    const type = searchParams.get('type');
    const taskId = searchParams.get('taskId');
    if (globalAvatar && avatarId === globalAvatar.id) {
      setAvatar(globalAvatar);
    }
    if (globalTask && taskId === globalTask.taskId) {
      setTask(globalTask);
    }
    if (step) {
      const imageType = IMAGE_TYPES.find((t) => t.id === globalTask?.taskName);
      if (imageType) {
        const stepCount = imageType.steps || 0;
        setStep(Math.min(stepCount, parseInt(step, 10)));
      } else {
        setStep(parseInt(step, 10));
      }
    }

    if (type && IMAGE_TYPES.some((t) => t.id === type)) {
      const selectedType = IMAGE_TYPES.find((t) => t.id === type);
      if (selectedType) {
        setType(selectedType);
      }
    }
  }, [searchParams, globalAvatar, globalTask, setStep, setType, setAvatar]);

  const displayTask = state.selectedImageTask?.filePath
    ? state.selectedImageTask
    : filteredTasks[0];

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
      task={displayTask}
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
          tasks={filteredTasks}
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
