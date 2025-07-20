"use client";
import React from "react";
import { StoreContext } from "@/store";
import { observer } from "mobx-react";
import { VideoResource } from "../entity/VideoResource";
import { UploadButton } from "../shared/UploadButton";
import { useResourceAPI } from "@/hooks/useResourceAPI";

export const VideoResourcesPanel = observer(() => {
  const store = React.useContext(StoreContext);
  const { data, isLoading, error, uploadResource, refreshResources } = useResourceAPI('video');

  React.useEffect(() => {
    if (data) {
      // Clear existing images if needed, or merge strategically
      store.videos = []; // or implement a merge strategy
      //only add new videos if not already present
      const existingVideoIds = new Set(store.videos.map(video => video.id));
      const newVideos = data.filter(video => !existingVideoIds.has(video.id));
      // Add new videos to the store
      newVideos.forEach(video => {
        store.addVideoResource({ id: video.id, src: video.src });
      });
      console.log(`✅ Loaded ${newVideos.length} new videos from database`);
    }
  }, [data, store]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Immediately save file to server
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/video', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        // Create blob URL from the saved file for immediate use
        const videoPath = data.file.path || data.file.filename;
        const videoId = data.file.filename || file.name;
        //add video to store with videoid and videoPath as array of objects
        store.addVideoResource({ id: videoId, src: videoPath });

        // Add to store with both blob URL and file info
        // store.addVideoResource(URL.createObjectURL(file));
        console.log('✅ Video uploaded and saved:', data.file.filename);
      } else {
        console.error('❌ Upload failed:', data.message);
        // Fallback to blob URL only
        //show error browser notification window.alert(`Error uploading video: ${data.message}`);
        window.alert(`Error uploading video: ${data.message}`);


      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      // Fallback to blob URL only
      store.addVideoResource({ id: '', src: URL.createObjectURL(file) });
    }
  };

  return (
    <>
      <div className="text-sm px-[16px] pt-[16px] pb-[8px] font-semibold flex justify-between items-center">
        <span>Videos</span>
        <span className="text-xs text-gray-500">
          {store.videos.length} • saved
        </span>
      </div>
      {store.videos.map((video, index) => {
        return <VideoResource key={video.src} video={video.src} index={index} id={video.id} />;
      })}
      <UploadButton
        accept="video/mp4,video/x-m4v,video/*"
        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold text-center mx-2 py-2 px-4 rounded-sm cursor-pointer"
        onChange={handleFileChange}
      />
    </>
  );
});