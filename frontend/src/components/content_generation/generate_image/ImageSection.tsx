import React, { useState } from 'react';
import { TextToImageTab } from './TextToImageTab';
import { ImageToImageTab } from './ImageToImageTab';
import { useGenerateImage } from '@/hooks/use-generate-image';
import { useNotification } from '@/contexts/NotificationContext';
import { type ImageRatio, ImageQuality, ImageTask } from '@/lib/types/tasks';
import { fileToBase64 } from '@/lib/base64Utils';
import { useImageGeneration } from '@/contexts/ImageGenerationContext';
import { getRandomSeed } from '@/utils/fakeData';
export const ImageSection: React.FC = () => {
  const [positivePrompt, setPositivePrompt] = useState(
    getRandomSeed('image_avatar_prompt'),
  );
  const { state, setTask, tasks } = useImageGeneration();
  const [negativePrompt, setNegativePrompt] = useState('low quality');
  const [imageRatio, setImageRatio] = useState<ImageRatio>('1:1');
  const [imageQuality, setImageQuality] = useState<ImageQuality>('medium');
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

    if (state.type?.id === 'image_to_image_edit' && !uploadedImageFile) {
      showNotification('Please upload an image file for editing.', 'error');
      return;
    }
    let encoded;
    if (state.type?.id === 'image_to_image_edit' && uploadedImageFile) {
      try {
        const base64 = await fileToBase64(uploadedImageFile);
        encoded = base64;
      } catch (error) {
        showNotification('Failed to process the uploaded image.', 'error');
        return;
      }
    }

    const payload = {
      avatar: state.avatar,
      taskName: state.type?.id,
      positivePrompt: positivePrompt,
      negativePrompt: negativePrompt,
      imageRatio: imageRatio || null,
      imageQuality: imageQuality,
      base64Image: encoded || null,
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
        />
      )}
    </div>
  );
};
