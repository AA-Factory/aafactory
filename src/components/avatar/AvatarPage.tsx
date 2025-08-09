'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HiDownload, HiSave, HiTrash, HiExclamationCircle, HiArrowLeft } from 'react-icons/hi';
import { validateField, validateFile, avatarSchema } from '@/utils/validation';
import { generateFakeFormData } from '@/utils/fakeData';
import { AvatarForm } from './AvatarForm';
import { useNotification } from '@/contexts/NotificationContext';
import { useAvatar, useCreateAvatar, useUpdateAvatar, useDeleteAvatar, useRefreshAvatars } from '@/hooks/useAvatars';

import Link from 'next/link'
import { encodeFormDataIntoImage, decodeFormDataFromImage, loadImageToCanvas, decodeDataFromImage } from '@/utils/steganography';
import { useRouter } from 'next/navigation' // NOT 'next/router'


interface AvatarPageProps {
  editMode?: boolean;
  avatarId?: string;
}
interface TouchedFields {
  [key: string]: boolean;
}

const AvatarPage: React.FC<AvatarPageProps> = ({ editMode = false, avatarId }) => {
  // ====== Hooks & Context ======
  const { showNotification, hideNotification, notification } = useNotification();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const router = useRouter();

  // ====== Data Fetching (TanStack Query) ======
  const { data: existingAvatar, isLoading: isLoadingAvatar, error: avatarError } = useAvatar(editMode ? avatarId : undefined);
  const createAvatarMutation = useCreateAvatar();
  const updateAvatarMutation = useUpdateAvatar();
  const deleteAvatarMutation = useDeleteAvatar();
  const { refreshAll } = useRefreshAvatars();

  // ====== Form State ======
  const [formData, setFormData] = useState<{ [key: string]: string }>(generateFakeFormData());
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // ====== UI State ======
  const [isDragging, setIsDragging] = useState(false);

  // ====== Avatar State ======
  const [selectedImage, setSelectedImage] = useState<null | string>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null); // Store the actual file
  const [encodedImage, setEncodedImage] = useState<null | string>(null);
  const [savedAvatarId, setSavedAvatarId] = useState<string | null>(null);
  const [hasNewImage, setHasNewImage] = useState(false); // Track if user uploaded a new image

  // ====== Refs ======
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const decodingCanvasRef = useRef<HTMLCanvasElement | null>(null); // Separate canvas for decoding

  useEffect(() => {
    const errors: { [key: string]: string } = {};
    let hasErrors = false;

    Object.keys(avatarSchema).forEach(fieldName => {
      if (touched[fieldName] || formData[fieldName]) {
        const validation = validateField(fieldName, formData[fieldName]);
        if (!validation.isValid) {
          errors[fieldName] = validation.error;
          hasErrors = true;
        }
      }
    });

    setFieldErrors(errors);
    setIsFormValid(!hasErrors && Object.values(formData).every(value => value && value.trim()));
  }, [formData, touched]);

  // Auto-load avatar in edit mode
  useEffect(() => {
    if (editMode && existingAvatar && !isLoadingAvatar) {
      setFormData({
        name: existingAvatar.name || '',
        personality: existingAvatar.personality || '',
        backgroundKnowledge: existingAvatar.backgroundKnowledge || '',
        voiceModel: existingAvatar.voiceModel || 'elevenlabs'
      });

      if (existingAvatar.imageUrl && existingAvatar.imageUrl !== '/placeholder-avatar.png') {
        setSelectedImage(existingAvatar.imageUrl);
        setHasNewImage(false); // This is the existing image, not a new one
      }

      // Clear validation states when loading existing data
      setFieldErrors({});
      setTouched({});
    }
  }, [editMode, existingAvatar]);

  // Auto-save avatarId when in edit mode
  useEffect(() => {
    if (editMode && avatarId) {
      setSavedAvatarId(avatarId);
    }
  }, [editMode, avatarId]);

  const handleFieldBlur = (fieldName: string): void => {
    setTouched((prev: TouchedFields) => ({ ...prev, [fieldName]: true }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear server errors when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageUpload = async (file) => {
    // Validate file first
    const fileValidation = validateFile(file);
    if (!fileValidation.isValid) {
      showNotification(fileValidation.error, 'error');
      return;
    }

    try {
      showNotification('Processing image...', 'info');
      const imageUrl = URL.createObjectURL(file);

      // Store both the URL and the file object
      setSelectedImage(imageUrl);
      setSelectedImageFile(file);
      setHasNewImage(true); // Mark that user uploaded a new image

      // Draw image to main canvas for potential upload
      if (canvasRef.current) {
        await loadImageToCanvas(file, canvasRef);
      }

      // Try to decode form data from the image using separate canvas
      if (decodingCanvasRef.current) {
        const imageData = await loadImageToCanvas(file, decodingCanvasRef);
        const decodedText = decodeDataFromImage(imageData);

        if (decodedText) {
          try {
            const decodedData = JSON.parse(decodedText);
            setFormData(decodedData);
            showNotification('Form data successfully decoded from image!', 'success');
          } catch {
            showNotification('Image loaded but no valid form data found', 'warning');
          }
        } else {
          showNotification('Image loaded - ready for encoding', 'info');
        }
      }
    } catch (err) {
      showNotification('Failed to process image: ' + err.message, 'error');
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDownload = () => {
    if (encodedImage) {
      const a = document.createElement('a');
      a.href = encodedImage;
      a.download = `${formData.name || 'avatar'}-encoded.png`;
      a.click();
    }
  };

  const handleSaveOnly = async () => {
    if (!isFormValid) {
      showNotification('Please fix all validation errors before saving', 'warning');
      setTouched(Object.keys(avatarSchema).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    try {
      showNotification('Saving avatar...', 'info');

      let avatarData = { ...formData };
      let file = null;
      let fileName = null;

      // If user uploaded a new image, include it in the save
      if (hasNewImage && selectedImageFile) {
        file = selectedImageFile;
        fileName = `${formData.name || 'avatar'}-original.png`;
        avatarData.hasEncodedData = false;
      } else if (hasNewImage && selectedImage && canvasRef.current) {
        // Fallback: if we have a canvas with the image drawn
        const blob = await new Promise<Blob>((resolve) => {
          canvasRef.current!.toBlob((blob) => resolve(blob!), 'image/png');
        });

        file = blob;
        fileName = `${formData.name || 'avatar'}-original.png`;
        avatarData.hasEncodedData = false;
      }

      if (editMode && avatarId) {
        // Update existing avatar
        const updateData: any = { id: avatarId, ...avatarData };
        if (file && fileName) {
          updateData.file = file;
          updateData.fileName = fileName;
        }

        await updateAvatarMutation.mutateAsync(updateData);
        showNotification('Avatar data successfully updated!', 'success');
      } else {
        // Create new avatar
        if (file) {
          await createAvatarMutation.mutateAsync({
            formData: avatarData,
            file,
            fileName
          });
        } else {
          await createAvatarMutation.mutateAsync({
            jsonData: avatarData
          });
        }
        showNotification('Avatar successfully saved!', 'success');
      }

      // Reset the new image flag after successful save
      setHasNewImage(false);

      // Refresh avatars list
      refreshAll();
      router.push('/avatars');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save avatar';
      showNotification(errorMessage, 'error');

      // Handle validation errors
      if (errorMessage.includes('Validation errors:')) {
        try {
          const validationErrors = JSON.parse(errorMessage.replace('Validation errors: ', ''));
          setFieldErrors(validationErrors);
        } catch {
          // If parsing fails, just show the general error
        }
      }
    }
  };

  const handleSaveAndEncode = async () => {
    if (!selectedImage) {
      showNotification('Please select an image first', 'warning');
      return;
    }

    if (!isFormValid) {
      showNotification('Please fix all validation errors before saving', 'warning');
      // Mark all fields as touched to show errors
      setTouched(Object.keys(avatarSchema).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    try {
      showNotification('Encoding avatar data into image...', 'info');

      let imageFile = selectedImageFile;

      // If no file object (e.g., editing existing avatar), fetch the image
      if (!imageFile && selectedImage) {
        const response = await fetch(selectedImage);
        imageFile = new File([await response.blob()], 'image.png');
      }

      if (!imageFile) {
        throw new Error('No image file available for encoding');
      }

      // Encode form data into image
      const { blob, downloadUrl } = await encodeFormDataIntoImage(formData, imageFile);
      setEncodedImage(downloadUrl);
      showNotification('Saving avatar and uploading encoded image...', 'info');

      const fileName = `${formData.name || 'avatar'}-encoded.png`;
      const avatarData = {
        ...formData,
        hasEncodedData: true
      };

      if (editMode && avatarId) {
        // Update existing avatar
        await updateAvatarMutation.mutateAsync({
          id: avatarId,
          ...avatarData,
          file: blob,
          fileName
        });
        showNotification('Avatar successfully updated and encoded!', 'success');
      } else {
        // Create new avatar
        await createAvatarMutation.mutateAsync({
          formData: avatarData,
          file: blob,
          fileName
        });
        showNotification('Avatar successfully saved and encoded!', 'success');
      }

      // Reset the new image flag after successful save
      setHasNewImage(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save avatar';
      showNotification(errorMessage, 'error');

      // Handle validation errors
      if (errorMessage.includes('Validation errors:')) {
        try {
          const validationErrors = JSON.parse(errorMessage.replace('Validation errors: ', ''));
          setFieldErrors(validationErrors);
        } catch {
          // If parsing fails, just show the general error
        }
      }
    }
  };

  const handleDeleteAvatar = async (avatarId) => {
    if (!avatarId) return;

    try {
      await deleteAvatarMutation.mutateAsync(avatarId);
      showNotification('Avatar and associated files deleted successfully!', 'success');
    } catch (err) {
      showNotification('Failed to delete avatar: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error');
    } finally {
      router.push('/avatars');
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            {/* Back Button */}
            <Link
              href="/avatars"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors mb-6"
            >
              <HiArrowLeft className="w-4 h-4" />
              <span>Back to Avatars</span>
            </Link>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {editMode ? 'Edit Avatar' : 'Avatar Creator'}
            </h1>
            <p className="text-gray-600">
              {editMode
                ? 'Update your avatar details and settings'
                : 'Create and save your avatar with steganography encoding'
              }
            </p>
          </div>

          {/* Avatar Infos Section */}
          <AvatarForm
            formData={formData}
            fieldErrors={fieldErrors}
            touched={touched}
            onChange={handleInputChange}
            onBlur={handleFieldBlur}
            selectedImage={selectedImage}
            isDragging={isDragging}
            fileInputRef={fileInputRef}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            handleFileSelect={handleFileSelect}
          />
          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Save Only Button */}
            <button
              onClick={handleSaveOnly}
              disabled={isLoadingAvatar || !isFormValid}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <HiSave className="h-5 w-5" />
              <span>{isLoadingAvatar ? 'Saving...' : savedAvatarId ? 'Update Avatar Data' : 'Save Avatar Data Only'}</span>
            </button>

            {/* Save and Encode Button */}
            <button
              onClick={handleSaveAndEncode}
              disabled={!selectedImage || isLoadingAvatar || !isFormValid}
              className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg transition-colors font-medium"
            >
              {isLoadingAvatar ? 'Processing...' : savedAvatarId ? 'Update & Encode to Image + Upload' : 'Save & Encode to Image + Upload'}
            </button>

            {/* Validation Status */}
            {!isFormValid && Object.keys(fieldErrors).length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <HiExclamationCircle className="h-5 w-5 text-yellow-600" />
                  <p className="text-yellow-800 text-sm font-medium">Please fix validation errors before saving</p>
                </div>
                <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                  {Object.entries(fieldErrors).map(([field, error]) => (
                    <li key={field}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Download Button */}
            {encodedImage && (
              <button
                onClick={handleDownload}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <HiDownload className="h-5 w-5" />
                <span>Download Encoded Image</span>
              </button>
            )}

            {savedAvatarId && (
              <button
                onClick={() => {
                  if (showConfirmation) {
                    handleDeleteAvatar(avatarId);
                    // setShowConfirmation(false);
                  } else {
                    setShowConfirmation(true);
                  }
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                disabled={isLoadingAvatar}
              >
                <HiTrash className="h-5 w-5" />
                <span>
                  {isLoadingAvatar ? 'Deleting...' : showConfirmation ? 'Are you sure?' : 'Delete Avatar'}
                </span>
              </button>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={decodingCanvasRef} className="hidden" />
        </div>
      </div>
    </div >
  );
};

export default AvatarPage;