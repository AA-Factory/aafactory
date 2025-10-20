// GenerationTemplate.tsx
'use client';
import React from 'react';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { StepProgress } from '@/components/content_generation/StepProgress';
import { Button } from '@/components/ui/Button';

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
}: GenerationTemplateProps) {
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
          </div>
        </aside>
        <div className="flex flex-col flex-1 min-w-0">
          <div
            className={`flex-1 min-h-0 p-6 flex items-center justify-center ${viewerContainerClassName}`}
          >
            {viewerComponent}
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
