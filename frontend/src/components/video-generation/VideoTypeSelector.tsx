import React from "react";
import { PiFileVideoBold } from "react-icons/pi";
import { useVideoGeneration } from "@/contexts/VideoGenerationContext";
import { VIDEO_TYPES } from "@/lib/celery/constants";
interface VideoType {
  id: string;
  label: string;
}

export const VideoTypeSelector: React.FC = () => {
  const { state, setVideoType } = useVideoGeneration();
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold mb-4 dark:text-white">Select video type</h2>
      <div className="grid grid-cols-1 gap-3 overflow-scroll">
        {VIDEO_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setVideoType(type)}
            disabled={type.id !== "talking_head"}
            className={`p-4 rounded-lg border-2 flex justify-center flex-col items-center space-y-2 transition-all w-full dark:text-white min-h-[130px] ${state.videoType.id === type.id
              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30"
              : type.id === "talking_head"
                ? "border-gray-200 dark:border-gray-700 hover:border-blue-400"
                : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed"
              }`}
          >
            <PiFileVideoBold className={`w-6 h-6 ${type.id === "talking_head"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-400 dark:text-gray-500"
              }`} />
            <span className={`font-semibold ${type.id === "talking_head"
              ? ""
              : "text-gray-500 dark:text-gray-400"
              }`}>
              {type.label}
              {type.id !== "talking_head" && (
                <span className="block text-xs font-normal mt-1">Coming Soon</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};