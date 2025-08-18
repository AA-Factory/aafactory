"use client";
import React, { useState } from "react";
import { FiChevronRight, FiChevronLeft, FiImage, FiEdit2, FiCheckCircle, FiPlayCircle } from "react-icons/fi";
import { TbSparkles } from "react-icons/tb";
import { PiFileVideoBold } from "react-icons/pi";
import { useAvatars } from "@/hooks/useAvatars";
import { useGenerateAudio } from '@/hooks/useGenerateAudio';
import { useGenerateVideo } from '@/hooks/useGenerateVideo';
import { useNotification } from '@/contexts/NotificationContext';

const VIDEO_TYPES = [
  { id: "conversational", label: "Conversational Video" },
  { id: "first_last", label: "First Last Frame" },
  { id: "text_to_video", label: "Text to Video" },
];

const DIALOG_SEEDS = [
  "Hey there! This is pretty cool right? Let's have a conversation about the future of AI.",
  "What's up everyone! Today we're going to talk about something really fascinating.",
  "Greetings! I hope you're having an amazing day. Let me share something interesting with you.",
  "Hello friends! Welcome back to another episode where we explore the unknown.",
  "Hey, what's happening? I've got something mind-blowing to share with you today.",
  "Good morning, afternoon, or evening wherever you are! Let's dive into something epic.",
  "Yo! Ready for another adventure? This is going to be absolutely incredible.",
  "Well hello there! I'm super excited to talk to you about this topic today.",
  "Hey everyone! Thanks for joining me. This conversation is going to be legendary.",
  "What's good? I've been thinking about this all day and I can't wait to share it.",
  "Alright, alright, alright! Let's get into something that'll blow your mind.",
  "Hey there, beautiful souls! Today's topic is something really close to my heart.",
];

const getRandomDialogSeed = () => {
  return DIALOG_SEEDS[Math.floor(Math.random() * DIALOG_SEEDS.length)];
};

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
  const { data: avatars, isLoading: avatarsLoading } = useAvatars();
  const [step, setStep] = useState(0);
  const [videoType, setVideoType] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [firstFrame, setFirstFrame] = useState<File | null>(null);
  const [lastFrame, setLastFrame] = useState<File | null>(null);
  const [dialog, setDialog] = useState(() => getRandomDialogSeed());
  const [audioReady, setAudioReady] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedAudioFilename, setGeneratedAudioFilename] = useState<string | null>(null);
  const generateAudioMutation = useGenerateAudio();
  const generateVideoMutation = useGenerateVideo();
  // For image previews
  const [firstFramePreview, setFirstFramePreview] = useState<string | null>(null);
  const [lastFramePreview, setLastFramePreview] = useState<string | null>(null);

  const { showNotification } = useNotification();
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

  const handleAudioGeneration = async () => {
    showNotification('Generating audio, this may take a minute...', 'info');

    generateAudioMutation.mutate({
      dialog,
      avatarId: avatar || '', // should always be set here
    }, {
      onSuccess: (result) => {
        setGeneratedAudioUrl(result.audioUrl);
        setGeneratedAudioFilename(result.filename);
        setAudioReady(true);
        showNotification('Audio generated successfully!', 'success');
        console.log('Generated audio URL:', result.audioUrl);
      },
      onError: (error) => {
        console.error('Audio generation failed:', error);
        showNotification('Audio generation failed. Please try again.', 'error');
      }
    });
  };

  const handleVideoGeneration = async () => {
    if (!generatedAudioFilename || !avatar) {
      showNotification('Please generate audio and select an avatar first.', 'error');
      return;
    }

    showNotification('Generating video, this may take a few minutes...', 'info');

    generateVideoMutation.mutate({
      audioFilename: generatedAudioFilename,
      avatarId: avatar,
      async: false
    }, {
      onSuccess: (result) => {
        console.log('✌️result --->', result);
        setGeneratedVideoUrl(result.videoUrl);
        showNotification('Video generated successfully!', 'success');
        console.log('Generated video URL:', result.videoUrl);
      },
      onError: (error) => {
        console.error('Video generation failed:', error);
        showNotification('Video generation failed. Please try again.', 'error');
      }
    });
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
                className={`p-4 rounded-lg border-2 flex flex-col items-center space-y-2 transition-all w-full ${videoType === type.id
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
          {avatarsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {avatars?.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAvatar(a.id)}
                  className={`rounded-lg border-2 flex flex-col items-center p-3 space-y-2 transition-all w-full ${avatar === a.id
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
              )) || []}
            </div>
          )}
        </div>
      ),
      canNext: !!avatar,
    },
    // {
    //   label: "Select 1st frame",
    //   content: (
    //     <div className="space-y-6">
    //       <h2 className="text-lg font-bold mb-4">Select 1st frame</h2>
    //       <div className="flex flex-col items-center space-y-4">
    //         <label className="cursor-pointer flex flex-col items-center">
    //           <input
    //             type="file"
    //             accept="image/*"
    //             className="hidden"
    //             onChange={(e) =>
    //               handleFileChange(e, setFirstFrame, setFirstFramePreview)
    //             }
    //           />
    //           <div className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
    //             {firstFramePreview ? (
    //               <img
    //                 src={firstFramePreview}
    //                 alt="First frame"
    //                 className="w-full h-full object-cover rounded-lg"
    //               />
    //             ) : (
    //               <FiImage className="w-8 h-8 text-gray-400" />
    //             )}
    //           </div>
    //           <span className="mt-2 text-xs text-gray-600 dark:text-gray-300">
    //             {firstFrame ? firstFrame.name : "Upload image"}
    //           </span>
    //         </label>
    //       </div>
    //     </div>
    //   ),
    //   canNext: !!firstFrame,
    // },
    // {
    //   label: "Select last frame",
    //   content: (
    //     <div className="space-y-6">
    //       <h2 className="text-lg font-bold mb-4">Select last frame</h2>
    //       <div className="flex flex-col items-center space-y-4">
    //         <label className="cursor-pointer flex flex-col items-center">
    //           <input
    //             type="file"
    //             accept="image/*"
    //             className="hidden"
    //             onChange={(e) =>
    //               handleFileChange(e, setLastFrame, setLastFramePreview)
    //             }
    //           />
    //           <div className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
    //             {lastFramePreview ? (
    //               <img
    //                 src={lastFramePreview}
    //                 alt="Last frame"
    //                 className="w-full h-full object-cover rounded-lg"
    //               />
    //             ) : (
    //               <FiImage className="w-8 h-8 text-gray-400" />
    //             )}
    //           </div>
    //           <span className="mt-2 text-xs text-gray-600 dark:text-gray-300">
    //             {lastFrame ? lastFrame.name : "Upload image"}
    //           </span>
    //         </label>
    //       </div>
    //     </div>
    //   ),
    //   canNext: !!lastFrame,
    // },
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
            <div className="flex space-x-2">
              <button
                onClick={handleAudioGeneration}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors flex items-center space-x-1"
                type="button"
              >
                <TbSparkles className="w-3 h-3" />
                <span>Generate Audio</span>
              </button>
              <button
                onClick={() => setDialog(getRandomDialogSeed())}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors flex items-center space-x-1"
                type="button"
              >
                <FiEdit2 className="w-3 h-3" />
                <span>Use AI suggestion</span>
              </button>
            </div>
          </div>
          {generatedAudioUrl && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-500/50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Generated Audio
                </span>
              </div>
              <audio
                controls
                src={generatedAudioUrl}
                className="w-full"
                preload="metadata"
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
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
              <strong>Avatar:</strong> {avatars?.find((a) => a.id === avatar)?.name}
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center space-x-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleVideoGeneration}
            disabled={!generatedAudioFilename || !avatar || generateVideoMutation.isPending}
          >
            <TbSparkles className="w-4 h-4" />
            <span>
              {generateVideoMutation.isPending ? 'Generating Video...' : 'Generate Video'}
            </span>
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
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-base border-2 ${step === idx
                    ? "bg-blue-600 text-white border-blue-600"
                    : step > idx
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 border-gray-300 dark:border-gray-600"
                    }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-sm ${step === idx
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
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors text-sm ${step === 0
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
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors text-sm ${steps[step].canNext
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
            {generatedVideoUrl ? (
              <video
                key="generated-video"
                src={generatedVideoUrl}
                controls
                className="w-full h-full rounded-xl object-contain bg-black"
              />
            ) : selectedVideo ? (
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
              className={`flex flex-col items-center space-y-1 min-w-[120px] max-w-[140px] p-2 rounded-lg border-2 transition-all ${selectedVideo?.id === vid.id
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

"use client";
import React, { useState, useRef, useCallback } from 'react';
import { 
  FiUpload, 
  FiPlay, 
  FiPause, 
  FiSettings, 
  FiLayers, 
  FiCamera,
  FiDownload,
  FiPlus,
  FiTrash2,
  FiMove,
  FiRotateCcw,
  FiZoomIn,
  FiClock,
  FiImage,
  FiSliders,
  FiUser
} from 'react-icons/fi';
import { TbSparkles } from 'react-icons/tb';
import { PiFileVideoBold } from 'react-icons/pi';

interface SceneLayer {
  id: string;
  type: 'image' | 'text' | 'shape';
  name: string;
  src?: string;
  content?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  visible: boolean;
}

interface CameraMovement {
  type: 'pan' | 'zoom' | 'rotate' | 'static';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startScale: number;
  endScale: number;
  duration: number;
}

interface GenerationSettings {
  duration: number;
  fps: number;
  resolution: string;
  seed: number;
}

interface AIAvatar {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'realistic' | 'stylized' | 'cartoon' | 'fantasy';
}

export default function GenerateVideoPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'format'>('compose');
  const [layers, setLayers] = useState<SceneLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [cameraMovement, setCameraMovement] = useState<CameraMovement>({
    type: 'static',
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    startScale: 1,
    endScale: 1,
    duration: 5
  });
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    duration: 5,
    fps: 24,
    resolution: '1024x576',
    seed: 42
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const availableAvatars: AIAvatar[] = [
    {
      id: 'avatar-1',
      name: 'Emma',
      description: 'Professional businesswoman',
      thumbnail: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      category: 'realistic'
    },
    {
      id: 'avatar-2',
      name: 'Marcus',
      description: 'Creative artist',
      thumbnail: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      category: 'realistic'
    },
    {
      id: 'avatar-3',
      name: 'Sophia',
      description: 'Tech entrepreneur',
      thumbnail: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      category: 'realistic'
    },
    {
      id: 'avatar-4',
      name: 'Alex',
      description: 'Fitness instructor',
      thumbnail: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      category: 'realistic'
    },
    {
      id: 'avatar-5',
      name: 'Luna',
      description: 'Anime character',
      thumbnail: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      category: 'stylized'
    },
    {
      id: 'avatar-6',
      name: 'Phoenix',
      description: 'Fantasy warrior',
      thumbnail: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      category: 'fantasy'
    }
  ];

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newLayer: SceneLayer = {
          id: Date.now().toString(),
          type: 'image',
          name: file.name,
          src: e.target?.result as string,
          x: 50,
          y: 50,
          scale: 1,
          rotation: 0,
          opacity: 1,
          visible: true
        };
        setLayers(prev => [...prev, newLayer]);
        setSelectedLayer(newLayer.id);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const updateLayer = useCallback((id: string, updates: Partial<SceneLayer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, ...updates } : layer
    ));
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== id));
    if (selectedLayer === id) {
      setSelectedLayer(null);
    }
  }, [selectedLayer]);

  const selectedLayerData = layers.find(layer => layer.id === selectedLayer);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <PiFileVideoBold className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold">Video Scene Builder</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center space-x-2">
              <TbSparkles className="w-4 h-4" />
              <span>Generate Video</span>
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <FiSettings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <nav className="px-6">
          <div className="flex space-x-8">
            {[
              { id: 'compose', label: 'Compose', icon: FiLayers },
              { id: 'format', label: 'Format', icon: FiSettings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === id 
                    ? 'border-purple-500 text-purple-400' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div className="flex h-[calc(100vh-8rem)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          {activeTab === 'compose' && (
            <>
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Scene Elements</h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 transition-colors flex flex-col items-center space-y-2"
                >
                  <FiUpload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm text-gray-400">Upload Image</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="p-4 border-b border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Scene Prompt</h4>
                <textarea
                  placeholder="Describe the motion and atmosphere you want in your video scene..."
                  className="w-full h-24 p-3 bg-gray-700 border border-gray-600 rounded-lg resize-none text-sm placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
                  defaultValue=""
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">0/500 characters</span>
                  <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    Use AI suggestions
                  </button>
                </div>
              </div>

              <div className="p-4 border-b border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-3">AI Avatars</h4>
                <div className="grid grid-cols-2 gap-3">
                  {availableAvatars.map((avatar) => (
                    <div
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.id === selectedAvatar ? null : avatar.id)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                        selectedAvatar === avatar.id 
                          ? 'ring-2 ring-purple-500 transform scale-105' 
                          : 'hover:ring-1 hover:ring-gray-500'
                      }`}
                    >
                      <img
                        src={avatar.thumbnail}
                        alt={avatar.name}
                        className="w-full h-20 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <div className="text-xs font-medium text-white">{avatar.name}</div>
                        <div className="text-xs text-gray-300">{avatar.description}</div>
                      </div>
                      {selectedAvatar === avatar.id && (
                        <div className="absolute top-1 right-1">
                          <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                            <FiUser className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                      <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                        avatar.category === 'realistic' ? 'bg-blue-500/80 text-white' :
                        avatar.category === 'stylized' ? 'bg-pink-500/80 text-white' :
                        avatar.category === 'cartoon' ? 'bg-yellow-500/80 text-black' :
                        'bg-purple-500/80 text-white'
                      }`}>
                        {avatar.category}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedAvatar && (
                  <div className="mt-3 p-2 bg-purple-600/20 border border-purple-500/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FiUser className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-purple-300">
                        {availableAvatars.find(a => a.id === selectedAvatar)?.name} selected
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Layers</h4>
                <div className="space-y-2">
                  {layers.map((layer) => (
                    <div
                      key={layer.id}
                      onClick={() => setSelectedLayer(layer.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                        selectedLayer === layer.id ? 'bg-purple-600/20 border border-purple-500/50' : 'bg-gray-700/50 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <FiImage className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium">{layer.name}</div>
                          <div className="text-xs text-gray-400">{layer.type}</div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLayer(layer.id);
                        }}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}


          {activeTab === 'format' && (
            <div className="p-4 space-y-6">
              <h3 className="text-lg font-semibold">Format Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Duration</label>
                  <input
                    type="number"
                    value={generationSettings.duration}
                    onChange={(e) => setGenerationSettings(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                    min="1"
                    max="60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Resolution</label>
                  <select
                    value={generationSettings.resolution}
                    onChange={(e) => setGenerationSettings(prev => ({ ...prev, resolution: e.target.value }))}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                  >
                    <option value="512x512">512x512</option>
                    <option value="1024x576">1024x576</option>
                    <option value="1024x1024">1024x1024</option>
                    <option value="1920x1080">1920x1080</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Seed</label>
                  <input
                    type="number"
                    value={generationSettings.seed}
                    onChange={(e) => setGenerationSettings(prev => ({ ...prev, seed: Number(e.target.value) }))}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col bg-gray-900">
          <div className="flex-1 relative">
            <div className="absolute inset-4 bg-black rounded-lg border border-gray-700 overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
                style={{ background: 'radial-gradient(circle, #1f2937 0%, #111827 100%)' }}
              />
              
              {/* Render layers */}
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className={`absolute transition-all duration-200 ${
                    selectedLayer === layer.id ? 'ring-2 ring-purple-500' : ''
                  }`}
                  style={{
                    left: `${layer.x}%`,
                    top: `${layer.y}%`,
                    transform: `scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                    opacity: layer.opacity,
                    display: layer.visible ? 'block' : 'none'
                  }}
                >
                  {layer.type === 'image' && layer.src && (
                    <img
                      src={layer.src}
                      alt={layer.name}
                      className="max-w-xs max-h-xs object-contain pointer-events-none"
                      draggable={false}
                    />
                  )}
                </div>
              ))}
              
              {layers.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <FiImage className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Upload an image to start building your scene</p>
                    <p className="text-sm">Drag and drop or click to upload</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="bg-gray-800 border-t border-gray-700 p-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5" />}
              </button>
              
              <div className="flex-1">
                <div className="relative">
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div 
                      className="h-2 bg-purple-600 rounded-full transition-all duration-100"
                      style={{ width: `${(currentTime / (cameraMovement.duration * 1000)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0:00</span>
                    <span>{Math.floor(cameraMovement.duration / 60)}:{(cameraMovement.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-400">
                {Math.floor(currentTime / 1000)}s / {cameraMovement.duration}s
              </div>
            </div>
          </div>
        </div>

        {/* Right Properties Panel */}
        {selectedLayerData && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
            <h3 className="text-lg font-semibold mb-4">Layer Properties</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={selectedLayerData.name}
                  onChange={(e) => updateLayer(selectedLayerData.id, { name: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">X Position</label>
                  <input
                    type="number"
                    value={selectedLayerData.x}
                    onChange={(e) => updateLayer(selectedLayerData.id, { x: Number(e.target.value) })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Y Position</label>
                  <input
                    type="number"
                    value={selectedLayerData.y}
                    onChange={(e) => updateLayer(selectedLayerData.id, { y: Number(e.target.value) })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Scale ({selectedLayerData.scale.toFixed(1)})</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={selectedLayerData.scale}
                  onChange={(e) => updateLayer(selectedLayerData.id, { scale: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Rotation ({selectedLayerData.rotation}°)</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedLayerData.rotation}
                  onChange={(e) => updateLayer(selectedLayerData.id, { rotation: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Opacity ({Math.round(selectedLayerData.opacity * 100)}%)</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedLayerData.opacity}
                  onChange={(e) => updateLayer(selectedLayerData.id, { opacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedLayerData.visible}
                  onChange={(e) => updateLayer(selectedLayerData.id, { visible: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm text-gray-400">Visible</label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
