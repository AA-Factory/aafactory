'use client';
import React from 'react';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { PiFileVideoBold } from 'react-icons/pi';
// Import components
import { AvatarSelector } from '@/components/content_generation/AvatarSelector';
import { GenerationTypeSelector } from '@/components/content_generation/GenerationTypeSelector';
import { StepProgress } from '@/components/content_generation/generate_video/StepProgress';
import { ImageSection } from '@/components/content_generation/generate_image/ImageSection';
import { GenerationGallery } from '@/components/content_generation/GenerationGallery';
import { ImageViewer } from '@/components/content_generation/generate_image/ImageViewer';
// Import context
import {
  ImageGenerationProvider,
  useImageGeneration,
} from '@/contexts/ImageGenerationContext';

import { IMAGE_TYPES } from '@/lib/task/constants';
function GenerateImageContent() {
  const { state, setStep, setAvatar, setType, setTask, canProceedToNextStep } =
    useImageGeneration();

  const steps = [
    {
      label: 'Select image type',
      content: (
        <GenerationTypeSelector
          state={state}
          setType={setType}
          types={IMAGE_TYPES}
          title="Select image type"
          icon={PiFileVideoBold}
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
    <div className="flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/95 dark:to-indigo-900/20">
      {/* Header with Stage Progress */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <StepProgress steps={steps} currentStep={state.step} />
        </div>
      </header>

      {/* Main layout: left panel (steps), center (player), bottom (gallery) */}
      <div className="flex flex-initial min-h-0">
        {/* Left panel: Stepper */}
        <aside className="w-80 min-w-[18rem] max-w-[22rem] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col p-6 h-174">
          {/* Step content */}
          <div className="flex-1 overflow-auto">
            {steps[state.step].content}
          </div>

          {/* Navigation buttons */}
          <div className="mt-4 flex justify-between">
            <button
              onClick={() => setStep(Math.max(0, state.step - 1))}
              disabled={state.step === 0}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 flex items-center"
            >
              <FiChevronLeft className="mr-2" />
              Back
            </button>
            {steps[state.step].canNext && (
              <button
                onClick={() =>
                  setStep(Math.min(steps.length - 1, state.step + 1))
                }
                disabled={
                  !canProceedToNextStep || state.step === steps.length - 1
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center"
              >
                Next
                <FiChevronRight className="ml-2" />
              </button>
            )}
          </div>
        </aside>
        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top: Video Player */}
          <div className="flex-1 min-h-0 p-6 flex items-center justify-center">
            <ImageViewer />
          </div>

          {/* Bottom: Video Gallery */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50 min-h-[160px]">
            <GenerationGallery
              emptyMessage="No images generated yet."
              mediaType="image"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GenerateImage() {
  return (
    <ImageGenerationProvider>
      <GenerateImageContent />
    </ImageGenerationProvider>
  );
}
