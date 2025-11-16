'use client';
import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { useActiveAvatars } from '@/contexts/ActiveAvatarsContext';

function GenerateVideoContent() {
  const searchParams = useSearchParams();
  const {
    state,
    setStep,
    setAvatar,
    setVideoType,
    setAudioData,
    setImage,
    videoTasks,
    loadingVideoTasks,
    selectVideoTask,
  } = useVideoGeneration();
  const { globalTask, globalAvatar } = useActiveAvatars();

  const filteredTasks = videoTasks.filter(
    (task) => task.taskName === state.videoType.id,
  );
  useEffect(() => {
    const step = searchParams.get('step');
    const avatarId = searchParams.get('avatarId');
    const type = searchParams.get('type');
    const taskId = searchParams.get('taskId');
    if (globalAvatar && avatarId === globalAvatar.id) {
      setAvatar(globalAvatar);
    }
    if (globalTask && taskId === globalTask.taskId) {
      selectVideoTask(globalTask);
      setImage(
        globalTask?.metadata?.imagePrompt?.filePath || '',
        globalTask?.metadata?.imagePrompt?.fileName || '',
      );

      if (globalTask?.metadata?.audioTask) {
        setAudioData({
          selectedAudioTask: globalTask?.metadata?.audioTask || null,
          generatedAudioBase64: null,
          uploadedAudioFile: null,
          dialog: globalTask?.metadata?.taskInfo?.dialog || '',
          audioReady: true,
        });
      }
    }
    if (step) {
      const videoType = VIDEO_TYPES.find((t) => t.id === globalTask?.taskName);
      if (videoType) {
        const stepCount = videoType.steps || 0;
        setStep(Math.min(stepCount, parseInt(step, 10)));
      } else {
        setStep(parseInt(step, 10));
      }
    }

    if (type && VIDEO_TYPES.some((t) => t.id === type)) {
      const selectedType = VIDEO_TYPES.find((t) => t.id === type);
      if (selectedType) {
        setVideoType(selectedType);
      }
    }
  }, [
    searchParams,
    globalAvatar,
    globalTask,
    setStep,
    setVideoType,
    setAvatar,
  ]);

  const displayTask = state.selectedVideoTask?.filePath
    ? state.selectedVideoTask
    : filteredTasks[0];

  // Determine steps based on video type
  const isImageAudioToVideo =
    state.videoType.id === 'prompt_image_audio_to_video';
  const isImageToAnimated = state.videoType.id === 'image_and_video_to_video';

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
    // Only include audio step for talking_head
    ...(isImageAudioToVideo
      ? [
          {
            label: 'Generate audio',
            content: <AudioSection />,
            canNext: state.audioReady,
          },
        ]
      : []),
    {
      label: isImageToAnimated ? 'Generate animation' : 'Generate video',
      content: <VideoSection />,
      canNext: false,
    },
  ];

  return (
    <GenerationTemplate
      steps={steps}
      currentStep={state.step}
      onStepChange={setStep}
      task={state.selectedVideoTask}
      viewerComponent={
        <MediaViewer
          type="video"
          src={displayTask?.filePath}
          alt="Generated video"
          showDownload={true}
          aspectRatio="video"
          maxWidth="max-w-2xl"
        />
      }
      galleryComponent={
        <GenerationGallery
          tasks={filteredTasks}
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
