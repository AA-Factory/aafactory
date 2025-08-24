"use client";
import React, { useState } from "react";
import { FiChevronRight, FiChevronLeft, FiUser, FiImage, FiEdit2, FiCheckCircle, FiPlayCircle } from "react-icons/fi";
import { TbSparkles } from "react-icons/tb";
import { PiFileVideoBold } from "react-icons/pi";

const VIDEO_TYPES = [
  { id: "conversational", label: "Conversational Video" },
  { id: "first_last", label: "First Last Frame" },
  { id: "text_to_video", label: "Text to Video" },
];

const AVATARS = [
  {
    id: "avatar-1",
    name: "Emma",
    description: "Professional businesswoman",
    imageUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
    category: "realistic",
  },
  {
    id: "avatar-2",
    name: "Marcus",
    description: "Creative artist",
    imageUrl: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
    category: "realistic",
  },
  {
    id: "avatar-3",
    name: "Sophia",
    description: "Tech entrepreneur",
    imageUrl: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
    category: "realistic",
  },
];

// Mock previous videos
const PREVIOUS_VIDEOS = [
  {
    id: "vid-1",
    title: "Conversational Video 1",
    thumbnail: "https://www.w3schools.com/html/mov_bbb.jpg",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: "vid-2",
    title: "First Last Frame Example",
    thumbnail: "https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217",
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
  },
  {
    id: "vid-3",
    title: "Text to Video Sample",
    thumbnail: "https://www.w3schools.com/html/pic_trulli.jpg",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
];

export default function GenerateVideoWizard() {
  const [step, setStep] = useState(0);
  const [videoType, setVideoType] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [firstFrame, setFirstFrame] = useState<File | null>(null);
  const [lastFrame, setLastFrame] = useState<File | null>(null);
  const [dialog, setDialog] = useState("");
  const [audioReady, setAudioReady] = useState(false);

  // For image previews
  const [firstFramePreview, setFirstFramePreview] = useState<string | null>(null);
  const [lastFramePreview, setLastFramePreview] = useState<string | null>(null);

  // Video player state
  const [selectedVideo, setSelectedVideo] = useState(PREVIOUS_VIDEOS[0]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (f: File | null) => void, previewSetter: (url: string | null) => void) => {
    const file = e.target.files?.[0] || null;
    setter(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => previewSetter(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      previewSetter(null);
    }
  };

  const steps = [
    {
      label: "Select video type",
      content: (
        <div className="space-y-6">
          <h2 className="text-lg font-bold mb-4">Select video type</h2>
          <div className="grid grid-cols-1 gap-3">
            {VIDEO_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setVideoType(type.id)}
                className={`p-4 rounded-lg border-2 flex flex-col items-center space-y-2 transition-all w-full ${
                  videoType === type.id
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-400"
                }`}
              >
                <PiFileVideoBold className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold">{type.label}</span>
                {videoType === type.id && (
                  <FiCheckCircle className="w-4 h-4 text-green-500 mt-2" />
                )}
              </button>
            ))}
          </div>
        </div>
      ),
      canNext: !!videoType,
    },
    {
      label: "Select Avatar",
      content: (
        <div className="space-y-6">
          <h2 className="text-lg font-bold mb-4">Select Avatar</h2>
          <div className="grid grid-cols-1 gap-3">
            {AVATARS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAvatar(a.id)}
                className={`rounded-lg border-2 flex flex-col items-center p-3 space-y-2 transition-all w-full ${
                  avatar === a.id
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-400"
                }`}
              >
                <img
                  src={a.imageUrl}
                  alt={a.name}
                  className="w-14 h-14 object-cover rounded-full"
                />
                <span className="font-semibold">{a.name}</span>
                <span className="text-xs text-gray-500">{a.description}</span>
                {avatar === a.id && (
                  <FiCheckCircle className="w-4 h-4 text-green-500 mt-2" />
                )}
              </button>
            ))}
          </div>
        </div>
      ),
      canNext: !!avatar,
    },
    {
      label: "Select 1st frame",
      content: (
        <div className="space-y-6">
          <h2 className="text-lg font-bold mb-4">Select 1st frame</h2>
          <div className="flex flex-col items-center space-y-4">
            <label className="cursor-pointer flex flex-col items-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileChange(e, setFirstFrame, setFirstFramePreview)
                }
              />
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                {firstFramePreview ? (
                  <img
                    src={firstFramePreview}
                    alt="First frame"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <FiImage className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <span className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                {firstFrame ? firstFrame.name : "Upload image"}
              </span>
            </label>
          </div>
        </div>
      ),
      canNext: !!firstFrame,
    },
    {
      label: "Select last frame",
      content: (
        <div className="space-y-6">
          <h2 className="text-lg font-bold mb-4">Select last frame</h2>
          <div className="flex flex-col items-center space-y-4">
            <label className="cursor-pointer flex flex-col items-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileChange(e, setLastFrame, setLastFramePreview)
                }
              />
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                {lastFramePreview ? (
                  <img
                    src={lastFramePreview}
                    alt="Last frame"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <FiImage className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <span className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                {lastFrame ? lastFrame.name : "Upload image"}
              </span>
            </label>
          </div>
        </div>
      ),
      canNext: !!lastFrame,
    },
    {
      label: "Write dialog",
      content: (
        <div className="space-y-6">
          <h2 className="text-lg font-bold mb-4">Write dialog</h2>
          <textarea
            className="w-full h-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800"
            placeholder="Type the dialog for your video here..."
            value={dialog}
            onChange={(e) => setDialog(e.target.value)}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {dialog.length}/500 characters
            </span>
            <button
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              onClick={() => setDialog("AI generated dialog example.")}
              type="button"
            >
              Use AI suggestion
            </button>
          </div>
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-500/50 rounded-lg flex items-center space-x-2">
            <FiEdit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-700 dark:text-blue-300">
              We need a way to create the audio before the video to make sure the quality is good
            </span>
            <label className="ml-auto flex items-center space-x-1">
              <input
                type="checkbox"
                checked={audioReady}
                onChange={() => setAudioReady((v) => !v)}
                className="rounded bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">Audio ready</span>
            </label>
          </div>
        </div>
      ),
      canNext: dialog.trim().length > 0 && audioReady,
    },
    {
      label: "Generate",
      content: (
        <div className="flex flex-col items-center space-y-4">
          <TbSparkles className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-bold mb-2">Ready to generate!</h2>
          <ul className="text-left text-gray-700 dark:text-gray-200 space-y-1 text-xs">
            <li>
              <strong>Video type:</strong> {VIDEO_TYPES.find((t) => t.id === videoType)?.label}
            </li>
            <li>
              <strong>Avatar:</strong> {AVATARS.find((a) => a.id === avatar)?.name}
            </li>
            <li>
              <strong>1st frame:</strong> {firstFrame?.name}
            </li>
            <li>
              <strong>Last frame:</strong> {lastFrame?.name}
            </li>
            <li>
              <strong>Dialog:</strong> {dialog}
            </li>
            <li>
              <strong>Audio ready:</strong> {audioReady ? "Yes" : "No"}
            </li>
          </ul>
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center space-x-2 transition-colors text-sm"
            onClick={() => alert("Video generation started!")}
          >
            <TbSparkles className="w-4 h-4" />
            <span>Generate Video</span>
          </button>
        </div>
      ),
      canNext: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/95 dark:to-indigo-900/20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 rounded-lg flex items-center justify-center">
              <PiFileVideoBold className="w-5 h-5 text-white dark:text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Generate Video</h1>
          </div>
        </div>
      </header>

      {/* Main layout: left panel (steps), center (player), bottom (gallery) */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel: Stepper */}
        <aside className="w-80 min-w-[18rem] max-w-[22rem] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col p-6">
          {/* Step indicators */}
          <div className="flex flex-col space-y-6 mb-8">
            {steps.map((s, idx) => (
              <div key={s.label} className="flex items-center space-x-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-base border-2 ${
                    step === idx
                      ? "bg-blue-600 text-white border-blue-600"
                      : step > idx
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-sm ${
                    step === idx
                      ? "text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          {/* Step content */}
          <div className="flex-1">{steps[step].content}</div>
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors text-sm ${
                step === 0
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              type="button"
            >
              <FiChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors text-sm ${
                steps[step].canNext
                  ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              disabled={!steps[step].canNext}
              type="button"
            >
              <span>Next</span>
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Main player area */}
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-3xl aspect-video bg-black rounded-xl shadow-lg flex items-center justify-center relative">
            {selectedVideo ? (
              <video
                key={selectedVideo.id}
                src={selectedVideo.videoUrl}
                poster={selectedVideo.thumbnail}
                controls
                className="w-full h-full rounded-xl object-contain bg-black"
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
                <FiPlayCircle className="w-16 h-16 mb-4" />
                <span className="text-lg">No video selected</span>
              </div>
            )}
            <div className="absolute bottom-2 right-4 bg-white/80 dark:bg-gray-900/80 px-3 py-1 rounded text-xs text-gray-700 dark:text-gray-200">
              {selectedVideo?.title}
            </div>
          </div>
        </main>
      </div>

      {/* Bottom gallery panel */}
      <footer className="w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center space-x-4 overflow-x-auto">
          {PREVIOUS_VIDEOS.map((vid) => (
            <button
              key={vid.id}
              onClick={() => setSelectedVideo(vid)}
              className={`flex flex-col items-center space-y-1 min-w-[120px] max-w-[140px] p-2 rounded-lg border-2 transition-all ${
                selectedVideo?.id === vid.id
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30"
                  : "border-transparent hover:border-blue-400"
              }`}
            >
              <img
                src={vid.thumbnail}
                alt={vid.title}
                className="w-24 h-16 object-cover rounded"
              />
              <span className="text-xs text-gray-700 dark:text-gray-200 truncate w-full">
                {vid.title}
              </span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
