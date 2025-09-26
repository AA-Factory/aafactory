import React from "react";
import { FiPlayCircle } from "react-icons/fi";
import { useVideoGeneration } from "@/contexts/VideoGenerationContext";

export const VideoPlayer: React.FC = () => {
  const { state } = useVideoGeneration();
  const renderVideoContent = () => {
    if (state.generatedVideoUrl) {
      return (
        <div className="relative w-full h-full">
          <video
            key="generated-video"
            src={state.generatedVideoUrl}
            controls
            className="w-full h-full rounded-xl object-contain bg-black"
          />
        </div>
      );
    }

    if (state.selectedVideoTask && state.selectedVideoTask.filePath) {
      return (
        <div className="relative w-full h-full">
          <video
            key={state.selectedVideoTask.taskId}
            src={state.selectedVideoTask.filePath}
            controls
            className="w-full h-full rounded-xl object-contain bg-black"
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
        <FiPlayCircle className="w-16 h-16 mb-4" />
        <span className="text-lg">No video selected</span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl aspect-video bg-black rounded-xl shadow-lg flex items-center justify-center relative">
      {renderVideoContent()}
    </div>
  );
};