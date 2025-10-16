'use client';
import React from 'react';
import { VIDEO_TYPES } from '@/lib/task/constants';
import { PiFileVideoBold } from 'react-icons/pi';
// Import components
import { AvatarSelector } from '@/components/content_generation/AvatarSelector';
import { AudioSection } from '@/components/content_generation/generate_video/AudioSection';
import { VideoSection } from '@/components/content_generation/generate_video/VideoSection';
import { VideoPlayer } from '@/components/content_generation/generate_video/VideoPlayer';
import { AvatarImageSelector } from '@/components/content_generation/generate_video/AvatarImageSelector';
import { GenerationTypeSelector } from '@/components/content_generation/GenerationTypeSelector';
import { GenerationTemplate } from '@/components/templates/GenerationTemplate';
import { GenerationGallery } from '@/components/content_generation/GenerationGallery';

// Import context
import {
  VideoGenerationProvider,
  useVideoGeneration,
} from '@/contexts/VideoGenerationContext';

function GenerateVideoContent() {
  const {
    state,
    setStep,
    setAvatar,
    setVideoType,
    videoTasks,
    loadingVideoTasks,
    selectVideoTask,
  } = useVideoGeneration();

  const steps = [
    {
      label: 'Select video type',
      content: (
        <GenerationTypeSelector
          state={{ type: state.videoType }}
          setType={setVideoType} // setVideoType is passed as setType
          types={VIDEO_TYPES}
          title="Select video type"
          icon={PiFileVideoBold}
        />
      ),
      canNext: !!state.videoType,
    },
    {
      label: 'Select avatar',
      content: <AvatarSelector state={state} setAvatar={setAvatar} />,
      canNext: !!state.avatar,
    },
    {
      label: 'Select Image',
      content: <AvatarImageSelector />,
      canNext: !!state.selectedImageFilePath,
    },
    {
      label: 'Generate audio',
      content: <AudioSection />,
      canNext: state.audioReady,
    },
    {
      label: 'Generate video',
      content: <VideoSection />,
      canNext: false,
    },
  ];

  return (
    <GenerationTemplate
      steps={steps}
      currentStep={state.step}
      onStepChange={setStep}
      viewerComponent={<VideoPlayer />}
      galleryComponent={
        <GenerationGallery
          tasks={videoTasks}
          selectedTask={state.selectedVideoTask}
          onTaskSelect={selectVideoTask}
          loading={loadingVideoTasks}
          emptyMessage="No videos generated yet."
          mediaType="video"
        />
      }
    />
  );
}

export default function GenerateVideo() {
  return (
    <VideoGenerationProvider>
      <GenerateVideoContent />
    </VideoGenerationProvider>
  );
}
