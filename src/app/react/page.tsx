'use client';

import React from 'react';
import { useVideo } from '@/hooks/useVideo';
const ReactPage: React.FC = () => {
  const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'; // Replace with your video URL
  const { data, error, isLoading } = useVideo(videoUrl);
  console.log('✌️isLoading  --->', isLoading);
  console.log('✌️data --->', data);
  return (
    <div>
      <h1 className="text-2xl font-bold">React Page</h1>
      <p className="mt-4 text-gray-700">
        This is the React page where you can explore React-related content and features.
      </p>
    </div>
  );
}

export default ReactPage;