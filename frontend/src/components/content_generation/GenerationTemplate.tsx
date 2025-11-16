// GenerationTemplate.tsx
'use client';
import React, { useState } from 'react';
import { FiChevronRight, FiChevronLeft, FiInfo, FiImage } from 'react-icons/fi';
import { StepProgress } from '@/components/content_generation/StepProgress';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TaskMetadataViewer } from '@/components/content_generation/TaskMetadataViewer';
import {
  TaskDocument,
  VideoTask,
  ImageTask,
  AudioTask,
} from '@/lib/types/tasks';
import Link from 'next/link';

interface Step {
  label: string;
  content: React.ReactNode;
  canNext: boolean;
  reason?: string;
}

interface GenerationTemplateProps {
  // Step configuration
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;

  // Main content components
  viewerComponent: React.ReactNode;
  galleryComponent: React.ReactNode;

  // Optional customization
  headerClassName?: string;
  sidebarClassName?: string;
  viewerContainerClassName?: string;
  galleryContainerClassName?: string;
  emptyGalleryMessage?: string;

  // Task metadata
  task?: TaskDocument | VideoTask | ImageTask | AudioTask | null;
}

export function GenerationTemplate({
  steps,
  currentStep,
  onStepChange,
  viewerComponent,
  galleryComponent,
  headerClassName = '',
  sidebarClassName = '',
  viewerContainerClassName = '',
  galleryContainerClassName = '',
  task,
}: GenerationTemplateProps) {
  const [showTaskInfo, setShowTaskInfo] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);

  // Check if we have media files to display
  const hasMediaFiles =
    task?.metadata &&
    ((task.metadata as any).imagePrompt?.filePath ||
      (task.metadata as any).videoPrompt?.filePath);

  const getMediaContent = () => {
    if (!task?.metadata) return null;
    const metadata = task.metadata as any;
    const imagePrompt = metadata.imagePrompt;
    const videoPrompt = metadata.videoPrompt;
    const audioPrompt = metadata.audioPrompt;
    return { imagePrompt, videoPrompt, audioPrompt };
  };
  return (
    <div className="flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/95 dark:to-indigo-900/20">
      {/* Header with Stage Progress */}
      <header
        className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4 ${headerClassName}`}
      >
        <div className="max-w-fit mx-auto">
          <StepProgress
            steps={steps}
            currentStep={currentStep}
            onStepChange={onStepChange}
          />
        </div>
      </header>

      {/* Main layout: left panel (steps), center (viewer), bottom (gallery) */}
      <div className="flex flex-initial min-h-0">
        {/* Left panel: Stepper */}
        <aside
          className={`w-80 min-w-[18rem] max-w-[22rem] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col p-6 h-174 ${sidebarClassName}`}
        >
          {/* Step content */}
          <div className="flex-1 overflow-auto p-1">
            {steps[currentStep].content}
          </div>
          {!steps[currentStep].canNext && steps[currentStep].reason && (
            <div className="text-sm text-red-500 mt-2 italic">
              {steps[currentStep].reason}
            </div>
          )}
          {/* Navigation buttons */}
          <div className="mt-4 flex justify-between">
            <Button
              onClick={() => onStepChange(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              variant="info"
            >
              <FiChevronLeft className="mr-2" />
              Back
            </Button>
            {/* Show Next button only if there are more steps */}
            {currentStep < steps.length - 1 && (
              <Button
                variant="info"
                onClick={() =>
                  onStepChange(Math.min(steps.length - 1, currentStep + 1))
                }
                disabled={!steps[currentStep].canNext}
              >
                Next
                <FiChevronRight className="ml-2" />
              </Button>
            )}
          </div>
        </aside>
        <div className="flex flex-col flex-1 min-w-0">
          <div
            className={`flex-1 min-h-0 p-6 flex bg-opacity-50 items-center justify-center relative ${viewerContainerClassName}`}
          >
            {/* Task Information Overlay */}
            {task?.metadata && showTaskInfo && (
              <div className="absolute inset-0 bg-opacity-50 z-20 overflow-auto backdrop-blur-sm">
                <div className="p-8 w-full">
                  <TaskMetadataViewer task={task} />
                </div>
              </div>
            )}

            {/* Task Information Button */}
            {task?.metadata && (
              <Button
                variant="info"
                className="absolute top-8 right-8 flex items-center gap-2 z-30"
                onMouseEnter={() => setShowTaskInfo(true)}
                onMouseLeave={() => setShowTaskInfo(false)}
              >
                <FiInfo className="w-4 h-4" />
                <span className="font-medium">Task Information</span>
              </Button>
            )}

            {/* Show Media Button */}
            {hasMediaFiles && (
              <Button
                variant="info"
                className="absolute top-20 right-8 flex items-center gap-2 z-30"
                onClick={() => setShowMediaModal(true)}
              >
                <FiImage className="w-4 h-4" />
                <span className="font-medium">View Input Media</span>
              </Button>
            )}

            {viewerComponent}

            {/* Media Modal */}
            <Modal
              isOpen={showMediaModal}
              onClose={() => setShowMediaModal(false)}
              title="Input Media"
            >
              {(() => {
                const media = getMediaContent();
                if (!media) return null;

                return (
                  <div className="space-y-6 flex items-center w-3xl max-w-2xs">
                    {/* Image Prompt */}
                    {media.imagePrompt?.filePath && (
                      <div className="space-y-2 m-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          Image Input
                        </h3>
                        <img
                          src={media.imagePrompt.filePath}
                          alt="Image prompt"
                          className="w-full rounded-lg shadow-lg"
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {media.imagePrompt.fileName}
                        </p>
                      </div>
                    )}

                    {/* Video Prompt */}
                    {media.videoPrompt?.filePath && (
                      <div className="space-y-2 m-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          Video Input
                        </h3>
                        <video
                          src={media.videoPrompt.filePath}
                          controls
                          className="w-full rounded-lg shadow-lg"
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {media.videoPrompt.fileName}
                        </p>
                      </div>
                    )}

                    {media.audioPrompt?.filePath && (
                      <div className="space-y-2 m-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          Audio Input
                        </h3>
                        <div>
                          <audio
                            src={media.audioPrompt.filePath}
                            controls
                            className="w-full rounded-lg shadow-lg"
                          />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {media.audioPrompt.fileName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </Modal>
          </div>
          <div
            className={`border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50 min-h-[160px] ${galleryContainerClassName}`}
          >
            {galleryComponent}
          </div>
        </div>
      </div>
    </div>
  );
}
