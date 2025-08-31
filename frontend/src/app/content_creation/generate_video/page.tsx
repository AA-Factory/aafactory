"use client";
import React from "react";
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";

// Import components
import { VideoTypeSelector } from "@/components/video-generation/VideoTypeSelector";
import { AvatarSelector } from "@/components/video-generation/AvatarSelector";
import { AudioSection } from "@/components/video-generation/AudioSection";
import { VideoSection } from "@/components/video-generation/VideoSection";
import { VideoPlayer } from "@/components/video-generation/VideoPlayer";
import { VideoGallery } from "@/components/video-generation/VideoGallery";
import { StepProgress } from "@/components/video-generation/StepProgress";

// Import context
import { VideoGenerationProvider, useVideoGeneration } from "@/contexts/VideoGenerationContext";

function GenerateVideoContent() {
  const { state, setStep, canProceedToNextStep } = useVideoGeneration();

  const steps = [
    {
      label: "Select video type",
      content: <VideoTypeSelector />,
      canNext: !!state.videoType,
    },
    {
      label: "Select avatar",
      content: <AvatarSelector />,
      canNext: !!state.avatar,
    },
    {
      label: "Generate audio",
      content: <AudioSection />,
      canNext: state.audioReady,
    },
    {
      label: "Generate video",
      content: <VideoSection />,
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
          <div className="flex-1">{steps[state.step].content}</div>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors text-sm ${state.step === 0
                ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              onClick={() => setStep(Math.max(0, state.step - 1))}
              disabled={state.step === 0}
            >
              <FiChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors text-sm ${!canProceedToNextStep || state.step === steps.length - 1
                ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              onClick={() => setStep(Math.min(steps.length - 1, state.step + 1))}
              disabled={!canProceedToNextStep || state.step === steps.length - 1}
            >
              <span>Next</span>
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top: Video Player */}
          <div className="flex-1 min-h-0 p-6 flex items-center justify-center">
            <VideoPlayer />
          </div>

          {/* Bottom: Video Gallery */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50 min-h-[160px]">
            <VideoGallery />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GenerateVideo() {
  return (
    <VideoGenerationProvider>
      <GenerateVideoContent />
    </VideoGenerationProvider>
  );
}