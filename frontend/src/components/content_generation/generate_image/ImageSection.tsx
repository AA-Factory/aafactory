import React, { useState } from 'react';
import { TextToImageTab } from './TextToImageTab';
import { ImageToImageTab } from './ImageToImageTab';
import { useGenerateImage } from '@/hooks/use-generate-image';
import { useNotification } from '@/contexts/NotificationContext';
import { type ImageRatio, ImageQuality, ImageTask } from '@/lib/types/tasks';

import { useImageGeneration } from '@/contexts/ImageGenerationContext';
import { getRandomSeed } from '@/utils/fakeData';
export const ImageSection: React.FC = () => {
  const { state, setTask, tasks } = useImageGeneration();
  const [positivePrompt, setPositivePrompt] = useState(
    state.selectedImageTask?.metadata?.taskInfo?.positivePrompt ||
      getRandomSeed('image_avatar_prompt'),
  );
  const [negativePrompt, setNegativePrompt] = useState(
    state.selectedImageTask?.metadata?.taskInfo?.negativePrompt ||
      'low quality',
  );
  const [imageRatio, setImageRatio] = useState<ImageRatio>(
    state.selectedImageTask?.metadata?.taskInfo?.imageRatio || '1:1',
  );
  const [imageQuality, setImageQuality] = useState<ImageQuality>(
    state.selectedImageTask?.metadata?.taskInfo?.imageQuality || 'medium',
  );
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);

  const generateImageMutation = useGenerateImage();
  const { showNotification } = useNotification();

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadedImageFile(file);
  };

  const handleSelectExistingImage = async (imageTask: ImageTask) => {
    try {
      // Fetch the image from the URL
      const response = await fetch(imageTask.filePath);
      const blob = await response.blob();

      // Create a File object from the blob
      const fileName = imageTask.fileName || 'selected-image.png';
      const file = new File([blob], fileName, { type: blob.type });

      setUploadedImageFile(file);
    } catch (error) {
      showNotification('Failed to load selected image', 'error');
    }
  };

  // Update local state when selectedImageTask changes
  React.useEffect(() => {
    if (state.selectedImageTask?.metadata?.taskInfo) {
      const taskInfo = state.selectedImageTask.metadata.taskInfo;
      if (taskInfo.positivePrompt) setPositivePrompt(taskInfo.positivePrompt);
      if (taskInfo.negativePrompt) setNegativePrompt(taskInfo.negativePrompt);
      if (taskInfo.imageRatio) setImageRatio(taskInfo.imageRatio);
      if (taskInfo.imageQuality) setImageQuality(taskInfo.imageQuality);
    }
  }, [state.selectedImageTask]);

  //setimageRatio based on the selected type
  React.useEffect(() => {
    if (state.type?.id === 'text_to_image') {
      setImageRatio('1:1'); // Default ratio for text-to-image
    } else if (state.type?.id === 'image_to_image_edit') {
      setImageRatio(null); // Default ratio for image-to-image
    }
  }, [state.type]);

  const handleImageGeneration = async () => {
    showNotification(
      `Generating ${state.type?.label} for ${state.avatar?.name}`,
      'info',
    );

    if (
      state.type?.id === 'image_to_image_edit' &&
      !uploadedImageFile &&
      !state.selectedImageTask
    ) {
      showNotification(
        'Please upload an image file for editing or select an existing image.',
        'error',
      );
      return;
    }
    let promptImage;
    if (state.type?.id === 'image_to_image_edit' && uploadedImageFile) {
      promptImage = uploadedImageFile;
    } else if (
      state.type?.id === 'image_to_image_edit' &&
      state.selectedImageTask
    ) {
      promptImage = state.selectedImageTask.filePath;
    }

    if (state.type == null) {
      showNotification('Image generation type is not selected.', 'error');
      return;
    }
    const payload = {
      avatar: state.avatar,
      taskName: state.type.id,
      positivePrompt: positivePrompt,
      negativePrompt: negativePrompt,
      imageRatio: imageRatio || null,
      imageQuality: imageQuality,
      promptImage: promptImage || null,
    };

    generateImageMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Tab Content */}
      {state.type?.id === 'text_to_image' ? (
        <TextToImageTab
          positivePrompt={positivePrompt}
          onPositivePromptChange={setPositivePrompt}
          negativePrompt={negativePrompt}
          onNegativePromptChange={setNegativePrompt}
          imageRatio={imageRatio}
          onImageRatioChange={setImageRatio}
          imageQuality={imageQuality}
          onImageQualityChange={setImageQuality}
          onImageGeneration={handleImageGeneration}
          isGenerating={generateImageMutation.isPending}
        />
      ) : (
        <ImageToImageTab
          uploadedImageFile={uploadedImageFile}
          onImageFileUpload={handleImageFileUpload}
          positivePrompt={positivePrompt}
          onPositivePromptChange={setPositivePrompt}
          negativePrompt={negativePrompt}
          onNegativePromptChange={setNegativePrompt}
          imageRatio={imageRatio}
          onImageRatioChange={setImageRatio}
          imageQuality={imageQuality}
          onImageQualityChange={setImageQuality}
          onImageGeneration={handleImageGeneration}
          isGenerating={generateImageMutation.isPending}
          imageTasks={tasks}
          onSelectExistingImage={handleSelectExistingImage}
          selectedImageTask={state.selectedImageTask}
        />
      )}
    </div>
  );
};
