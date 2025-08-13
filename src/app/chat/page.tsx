'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useGenerateImage } from '@/hooks/useVideo';


const ChatPage: React.FC = () => {
  const generateImageMutation = useGenerateImage();

  const handleGenerateImage = () => {
    console.log('Generating image...');
    // Call with empty payload for default behavior (sync mode)
    generateImageMutation.mutate({});
  };



  return (
    <div>
      <h1>Generate Image</h1>
      <button onClick={handleGenerateImage}>
        Generate Image (Sync)
      </button>
      {/* <button onClick={handleGenerateImageAsync}>
        Generate Image (Async)
      </button> */}

      {generateImageMutation.isPending && <p>Generating...</p>}
      {generateImageMutation.error && <p>Error: {String(generateImageMutation.error)}</p>}
      {generateImageMutation.data && <p>Success! Check console for details.</p>}
    </div>
  );
}

export default ChatPage;