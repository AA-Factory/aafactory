"use client";
import React, { useState, useEffect } from "react";
import {
  FiChevronRight,
  FiChevronLeft,
  FiImage,
  FiEdit2,
  FiCheckCircle,
  FiPlayCircle,
  FiInfo,
} from "react-icons/fi";
import { TbSparkles } from "react-icons/tb";
import { PiFileVideoBold } from "react-icons/pi";
import { useAvatars } from "@/hooks/useAvatars";
import { useGenerateAudio } from "@/hooks/useGenerateAudio";
import { useGenerateVideo } from "@/hooks/useGenerateVideo";
import { useNotification } from "@/contexts/NotificationContext";
import { Avatar } from "@/types/avatar";
import { DIALOG_SEEDS } from "@/utils/fakeData";
const VIDEO_TYPES = [
  { id: "conversational", label: "Conversational Video" },
  { id: "first_last", label: "First Last Frame" },
  { id: "text_to_video", label: "Text to Video" },
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
    thumbnail:
      "https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217",
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
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [firstFrame, setFirstFrame] = useState<File | null>(null);
  const [lastFrame, setLastFrame] = useState<File | null>(null);
  const [dialog, setDialog] = useState(() => getRandomDialogSeed());
  const [audioReady, setAudioReady] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(
    null,
  );
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(
    null,
  );
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(
    null,
  );
  const [savingVideo, setSavingVideo] = useState(false);
  const [generatedAudioFilename, setGeneratedAudioFilename] = useState<
    string | null
  >(null);
  const [selectedAudioSource, setSelectedAudioSource] = useState<
    'avatar' | 'rick_and_morty' | 'japanese'
  >('rick_and_morty');
  const [availableAudioTasks, setAvailableAudioTasks] = useState<any[]>([]);
  const [selectedAudioTask, setSelectedAudioTask] = useState<any | null>(null);
  const [loadingAudioTasks, setLoadingAudioTasks] = useState(false);
  const generateAudioMutation = useGenerateAudio();
  const generateVideoMutation = useGenerateVideo();
  // For image previews
  const [firstFramePreview, setFirstFramePreview] = useState<string | null>(
    null,
  );
  const [lastFramePreview, setLastFramePreview] = useState<string | null>(null);

  const { showNotification } = useNotification();
  // Video player state
  const [selectedVideo, setSelectedVideo] = useState(PREVIOUS_VIDEOS[0]);

  // Fetch available audio tasks when avatar changes
  useEffect(() => {
    if (avatar?.id) {
      setLoadingAudioTasks(true);
      fetch(`/api/tasks/audio/${avatar.id}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setAvailableAudioTasks(data.audioTasks);
            // Auto-select the most recent audio task
            // if (data.audioTasks.length > 0) {
            //   setSelectedAudioTask(data.audioTasks[0]);
            // }
          }
        })
        .catch(error => {
          console.error('Error fetching audio tasks:', error);
        })
        .finally(() => {
          setLoadingAudioTasks(false);
        });
    } else {
      setAvailableAudioTasks([]);
      setSelectedAudioTask(null);
    }
  }, [avatar?.id, step, generatedAudioUrl]);

  // Auto-select avatar audio source if available when avatar changes
  useEffect(() => {
    if (avatar?.trainingAudioPath) {
      setSelectedAudioSource('avatar');
    } else if (selectedAudioSource === 'avatar') {
      // Only change if user had avatar selected but new avatar has no audio
      setSelectedAudioSource('rick_and_morty');
    }
  }, [avatar?.id, avatar?.trainingAudioPath]); // Only depend on avatar ID and audio path

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void,
    previewSetter: (url: string | null) => void,
  ) => {
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
    showNotification("Generating audio, this may take a minute...", "info");

    generateAudioMutation.mutate(
      {
        dialog,
        avatar,
        async: true,
        audioSource: selectedAudioSource,
      },
      {
        onSuccess: (result) => {
          setGeneratedAudioUrl(result.audioUrl);
          setGeneratedAudioBase64(result.base64Audio || null);
          setGeneratedAudioFilename(result.filename);
          setAudioReady(true);
          setSelectedAudioTask(null); // Clear selected audio task when new audio is generated
          showNotification("Audio generated successfully!", "success");
          console.log("Generated audio URL:", result.audioUrl);
        },
        onError: (error) => {
          console.error("Audio generation failed:", error);
          showNotification(
            "Audio generation failed. Please try again.",
            "error",
          );
        },
      },
    );
  };

  const handleVideoGeneration = async () => {
    if (!avatar) {
      showNotification(
        "Please select an avatar first.",
        "error",
      );
      return;
    }

    if (!selectedAudioTask && !generatedAudioBase64) {
      showNotification(
        "Please select an audio generation or generate new audio first.",
        "error",
      );
      return;
    }

    showNotification(
      "Generating video, this may take a few minutes...",
      "info",
    );

    let audioToUse = generatedAudioBase64;

    // If using a selected audio task, fetch the audio file and convert to base64
    if (selectedAudioTask && !generatedAudioBase64) {
      try {
        const audioResponse = await fetch(selectedAudioTask.filePath);
        const audioBlob = await audioResponse.blob();

        // Convert blob to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix to get pure base64
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(audioBlob);
        audioToUse = await base64Promise;
      } catch (error) {
        console.error('Error converting selected audio to base64:', error);
        showNotification("Failed to process selected audio. Please try again.", "error");
        return;
      }
    }

    generateVideoMutation.mutate(
      {
        prompt: selectedAudioTask ? selectedAudioTask.userPrompt : dialog,
        avatar,
        async: true,
        audioBase64: audioToUse || "",
      },
      {
        onSuccess: (result) => {
          setGeneratedVideoUrl(result.videoUrl);
          showNotification("Video generated successfully!", "success");
          console.log("Generated video URL:", result.videoUrl);
        },
        onError: (error) => {
          console.error("Video generation failed:", error);
          showNotification(
            "Video generation failed. Please try again.",
            "error",
          );
        },
      },
    );
  };

  const handleSaveVideo = async () => {
    if (!generatedVideoUrl) return;

    setSavingVideo(true);
    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: generatedVideoUrl,
          title: `Generated Video - ${new Date().toISOString()}`,
        }),
      });

      if (response.ok) {
        showNotification("Video saved successfully!", "success");
      } else {
        throw new Error('Failed to save video');
      }
    } catch (error) {
      console.error('Save video error:', error);
      showNotification("Failed to save video. Please try again.", "error");
    } finally {
      setSavingVideo(false);
    }
  };

  const steps = [
    {
      label: "Select video type",
      content: (
        <div className="space-y-6">
          <h2 className="text-lg font-bold mb-4 dark:text-white">Select video type</h2>
          <div className="grid grid-cols-1 gap-3 overflow-scroll h-96">
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
                {/* {videoType === type.id && (
                  <FiCheckCircle className="w-4 h-4 text-green-500 mt-2" />
                )} */}
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
          <h2 className="text-lg font-bold mb-4 dark:text-white">Select Avatar</h2>
          {avatarsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 overflow-scroll h-96">
              {avatars?.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAvatar(a)}
                  className={`rounded-lg border-2 flex flex-col items-center p-3 space-y-2 transition-all w-full ${avatar?.id === a.id
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
                  {/* {avatar?.id === a.id && (
                    <FiCheckCircle className="w-4 h-4 text-green-500 mt-2" />
                  )} */}
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
          <h2 className="text-lg font-bold mb-4 dark:text-white">Write dialog</h2>
          {/* Audio Source Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center space-x-2">
                <span>Training Audio Source</span>
                <div className="relative group">
                  <FiInfo className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Choose the voice training audio for speech generation
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
                  </div>
                </div>
              </div>
            </label>
            <select
              value={selectedAudioSource}
              onChange={(e) => setSelectedAudioSource(e.target.value as 'avatar' | 'rick_and_morty' | 'japanese')}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 text-sm"
            >
              {avatar?.trainingAudioPath && (
                <option value="avatar">
                  Avatar's uploaded audio
                </option>
              )}
              <option value="rick_and_morty">
                Rick and Morty (default)
              </option>
              <option value="japanese">
                Japanese Voice
              </option>
            </select>
          </div>


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
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                disabled={generateAudioMutation.isPending}
              >
                <TbSparkles className="w-3 h-3" />
                <span>Generate Audio</span>
              </button>
            </div>
          </div>
          {/* Audio Selection */}
          {availableAudioTasks.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center space-x-2">
                  <span>Select Audio For Video Generation</span>
                  <div className="relative group">
                    <FiInfo className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Select audio to be used for video generation either the latest generation or previous generations
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
                    </div>
                  </div>
                </div>
              </label>
              {loadingAudioTasks ? (
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loading audio generations...</span>
                </div>
              ) : (
                <select
                  value={selectedAudioTask?.taskId || (generatedAudioUrl && !selectedAudioTask ? 'generated' : '')}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'generated') {
                      setSelectedAudioTask(null);
                      // Keep the generated audio URL as is
                    } else {
                      const task = availableAudioTasks.find(t => t.taskId === value);
                      setSelectedAudioTask(task || null);
                      if (task) {
                        setGeneratedAudioUrl(task.filePath);
                        setAudioReady(false); // Clear the manual audio ready flag
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="">Select an audio generation</option>
                  {generatedAudioUrl && (
                    <option value="generated">Generated Audio (Current)</option>
                  )}
                  {availableAudioTasks.map((task, index) => (
                    <option key={task.taskId} value={task.taskId}>
                      {index + 1}. "{task.userPrompt || 'Audio Generation'}"
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Single Audio Player */}
          {(generatedAudioUrl || selectedAudioTask) && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-500/50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {selectedAudioTask
                    ? `Selected Audio: ${availableAudioTasks.findIndex(task => task.taskId === selectedAudioTask.taskId) + 1}`
                    : "Generated Audio"
                  }
                </span>
              </div>
              <audio
                controls
                src={selectedAudioTask ? selectedAudioTask.filePath : generatedAudioUrl}
                className="w-full"
                preload="metadata"
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-500/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <FiEdit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-blue-700 dark:text-blue-300">
                {availableAudioTasks.length > 0
                  ? "Generate new audio or select from previous generations above"
                  : "Generate audio before creating video to ensure quality"
                }
              </span>
            </div>
          </div> */}
        </div>
      ),
      canNext: dialog.trim().length > 0 && (audioReady || !!selectedAudioTask),
    },
    {
      label: "Generate",
      content: (
        <div className="flex flex-col items-center space-y-4">
          <TbSparkles className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-bold mb-4 dark:text-white">Ready to generate!</h2>


          <ul className="text-left text-gray-700 dark:text-gray-200 space-y-1 text-xs">
            <li>
              <strong>Video type:</strong>{" "}
              {VIDEO_TYPES.find((t) => t.id === videoType)?.label}
            </li>
            <li>
              <strong>Avatar:</strong>{" "}
              {avatars?.find((a) => a.id === avatar?.id)?.name}
            </li>
            <li>
              <strong>1st frame:</strong> {firstFrame?.name}
            </li>
            <li>
              <strong>Last frame:</strong> {lastFrame?.name}
            </li>
            <li>
              <strong>Dialog:</strong> {selectedAudioTask ? selectedAudioTask.userPrompt : dialog}
            </li>
            <li>
              <strong>Audio:</strong> {selectedAudioTask ? "Selected from previous generation" : audioReady ? "Generated" : "Not ready"}
            </li>
          </ul>
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center space-x-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleVideoGeneration}
            disabled={
              (!selectedAudioTask && !generatedAudioFilename) ||
              !avatar ||
              generateVideoMutation.isPending
            }
          >
            <TbSparkles className="w-4 h-4" />
            <span>
              {generateVideoMutation.isPending
                ? "Generating Video..."
                : "Generate Video"}
            </span>
          </button>
        </div>
      ),
      canNext: false,
    },
  ];

  return (
    <div className="flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/95 dark:to-indigo-900/20">
      {/* Header with Stage Progress */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Generate Video
          </h1> */}

          {/* Stage Progress Indicator */}

          <ol className="flex items-center w-full p-3 space-x-2 text-sm font-medium text-center text-gray-500 bg-white border border-gray-200 rounded-lg shadow-xs dark:text-gray-400 sm:text-base dark:bg-gray-800 dark:border-gray-700 sm:p-4 sm:space-x-4 rtl:space-x-reverse">
            {steps.map((s, idx) => (
              <li key={s.label} className={`flex items-center ${step === idx
                ? "text-blue-600 dark:text-blue-500"
                : step > idx
                  ? "text-green-600 dark:text-green-500"
                  : "text-gray-500 dark:text-gray-400"
                }`}>
                <span className={`flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0 ${step === idx
                  ? "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                  : step > idx
                    ? "border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/30"
                    : "border-gray-500 dark:border-gray-400"
                  }`}>
                  {step > idx ? (
                    <FiCheckCircle className="w-3 h-3" />
                  ) : (
                    idx + 1
                  )}
                </span>
                <span className="hidden sm:inline-flex">
                  {s.label}
                </span>
                <span className="sm:hidden">
                  {idx + 1}
                </span>
                {idx < steps.length - 1 && (
                  <svg className="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m7 9 4-4-4-4M1 9l4-4-4-4" />
                  </svg>
                )}
              </li>
            ))}
          </ol>


        </div>
      </header>

      {/* Main layout: left panel (steps), center (player), bottom (gallery) */}
      <div className="flex flex-initial min-h-0">
        {/* Left panel: Stepper */}
        <aside className="w-80 min-w-[18rem] max-w-[22rem] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col p-6 h-153">
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
              <div className="relative w-full h-full">
                <video
                  key="generated-video"
                  src={generatedVideoUrl}
                  controls
                  className="w-full h-full rounded-xl object-contain bg-black"
                />
                <button
                  onClick={handleSaveVideo}
                  className="absolute top-4 right-4 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors flex items-center space-x-2"
                  disabled={savingVideo}
                >
                  {savingVideo ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="w-4 h-4" />
                      <span>Save Video</span>
                    </>
                  )}
                </button>
              </div>
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
