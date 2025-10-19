'use client';
import React from 'react';
import { VIDEO_TYPES } from '@/lib/task/constants';
import { PiFileVideoBold } from 'react-icons/pi';
// Import components
import { AvatarSelector } from '@/components/content_generation/AvatarSelector';
import { AudioSection } from '@/components/content_generation/generate_video/AudioSection';
import { VideoSection } from '@/components/content_generation/generate_video/VideoSection';
import { MediaViewer } from '@/components/content_generation/MediaViewer';
import { AvatarImageSelector } from '@/components/content_generation/generate_video/AvatarImageSelector';
import { GenerationTypeSelector } from '@/components/content_generation/GenerationTypeSelector';
import { GenerationTemplate } from '@/components/content_generation/GenerationTemplate';
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

  // Determine video source
  const videoSrc = state.selectedVideoTask?.filePath
    ? state.selectedVideoTask
    : videoTasks[0];

  const getFileName = () => {
    if (!videoSrc) return 'No video selected';
    return videoSrc.filePath.split('/').pop() || 'No video selected';
  };

  const getSrc = () => {
    if (!videoSrc) return undefined;
    return `/api/file/video/${videoSrc.fileName}`;
  };

  const steps = [
    {
      label: 'Select video type',
      content: (
        <GenerationTypeSelector
          state={{ type: state.videoType }}
          setType={setVideoType} // setVideoType is passed as setType
          types={VIDEO_TYPES}
          title="Select video type"
          tooltip="Choose the type of video generation you want to perform"
          icon={PiFileVideoBold}
        />
      ),
      canNext: !!state.videoType,
    },
    {
      label: 'Select avatar',
      content: (
        <AvatarSelector
          selectedAvatar={state.avatar}
          setAvatar={setAvatar}
          tooltip="Choose an avatar to use for video generation"
        />
      ),
      canNext: !!state.avatar,
    },
    {
      label: 'Select Image',
      content: <AvatarImageSelector />,
      canNext:
        !!state.selectedImageFilePath &&
        state.selectedImageFileName !== 'placeholder-avatar.png',
      reason: 'Ensure image is selected and not the placeholder.',
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
      viewerComponent={
        <MediaViewer
          type="video"
          src={getSrc()}
          alt="Generated video"
          fileName={getFileName()}
          showDownload={true}
          aspectRatio="video"
          maxWidth="max-w-2xl"
        />
      }
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
