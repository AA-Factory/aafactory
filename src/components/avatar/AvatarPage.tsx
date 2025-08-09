'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HiDownload, HiSave, HiTrash, HiExclamationCircle, HiArrowLeft } from 'react-icons/hi';
import { validateField, validateFile, avatarSchema } from '@/utils/validation';
import { generateFakeFormData } from '@/utils/fakeData';
import { AvatarForm } from './AvatarForm';
import { useNotification } from '@/contexts/NotificationContext';
import { useAvatar, useCreateAvatar, useUpdateAvatar, useDeleteAvatar, useRefreshAvatars } from '@/hooks/useAvatars';
import Link from 'next/link';
import { encodeFormDataIntoImage, decodeDataFromImage, loadImageToCanvas } from '@/utils/steganography';
import { useRouter } from 'next/navigation';

type AvatarPageProps = {
  editMode?: boolean;
  avatarId?: string;
};

type TouchedFields = { [key: string]: boolean };

export default function AvatarPage({ editMode = false, avatarId }: AvatarPageProps) {
  // Context / router
  const { showNotification, hideNotification } = useNotification();
  const router = useRouter();

  // Queries / mutations
  const { data: existingAvatar, isLoading: isLoadingAvatar } = useAvatar(editMode ? avatarId : undefined);
  const createAvatarMutation = useCreateAvatar();
  const updateAvatarMutation = useUpdateAvatar();
  const deleteAvatarMutation = useDeleteAvatar();
  const { refreshAll } = useRefreshAvatars();

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const decodingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Form state
  const [formData, setFormData] = useState<{ [k: string]: string }>(() => generateFakeFormData());
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: string }>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Avatar / UI state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [encodedImage, setEncodedImage] = useState<string | null>(null);
  const [savedAvatarId, setSavedAvatarId] = useState<string | null>(null);
  const [hasNewImage, setHasNewImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // ---- Validation effect ----
  useEffect(() => {
    const errors: { [k: string]: string } = {};
    let hasErrors = false;

    Object.keys(avatarSchema).forEach((fieldName) => {
      if (touched[fieldName] || formData[fieldName]) {
        const { isValid, error } = validateField(fieldName, formData[fieldName]);
        if (!isValid) {
          errors[fieldName] = error;
          hasErrors = true;
        }
      }
    });

    setFieldErrors(errors);
    setIsFormValid(!hasErrors && Object.values(formData).every((v) => Boolean(v && v.trim())));
  }, [formData, touched]);

  // ---- Load existing avatar into form when editing ----
  useEffect(() => {
    if (!editMode) return;
    if (!existingAvatar || isLoadingAvatar) return;

    setFormData({
      name: existingAvatar.name || '',
      personality: existingAvatar.personality || '',
      backgroundKnowledge: existingAvatar.backgroundKnowledge || '',
      voiceModel: existingAvatar.voiceModel || 'elevenlabs',
    });

    if (existingAvatar.imageUrl && existingAvatar.imageUrl !== '/placeholder-avatar.png') {
      setSelectedImage(existingAvatar.imageUrl);
      setHasNewImage(false);
    }

    setFieldErrors({});
    setTouched({});
  }, [editMode, existingAvatar, isLoadingAvatar]);

  // ---- Save avatarId in state for UI ----
  useEffect(() => {
    if (editMode && avatarId) setSavedAvatarId(avatarId);
  }, [editMode, avatarId]);

  // ---- Handlers for form fields ----
  const handleFieldBlur = useCallback((fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [fieldErrors]);

  const markAllTouched = useCallback(() => {
    setTouched(Object.keys(avatarSchema).reduce((acc: TouchedFields, k) => ({ ...acc, [k]: true }), {}));
  }, []);

  // ---- Image upload / decode ----
  const handleImageUpload = useCallback(async (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      showNotification(validation.error, 'error');
      return;
    }

    try {
      showNotification('Processing image...', 'info');
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setSelectedImageFile(file);
      setHasNewImage(true);

      // draw to main canvas (for eventual toBlob fallback)
      if (canvasRef.current) await loadImageToCanvas(file, canvasRef);

      // attempt to decode embedded form data
      if (decodingCanvasRef.current) {
        const imageData = await loadImageToCanvas(file, decodingCanvasRef);
        const decodedText = decodeDataFromImage(imageData);
        if (decodedText) {
          try {
            const decoded = JSON.parse(decodedText);
            setFormData(decoded);
            showNotification('Form data successfully decoded from image!', 'success');
          } catch (e) {
            showNotification('Image loaded but no valid form data found', 'warning');
          }
        } else {
          showNotification('Image loaded - ready for encoding', 'info');
        }
      }
    } catch (err: any) {
      showNotification('Failed to process image: ' + (err?.message ?? String(err)), 'error');
    }
  }, [showNotification]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) handleImageUpload(files[0]);
  }, [handleImageUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  // ---- Helpers for saving ----
  const buildFileFromCanvas = useCallback(async (): Promise<Blob | null> => {
    if (!canvasRef.current) return null;
    return await new Promise<Blob | null>((resolve) =>
      canvasRef.current!.toBlob((b) => resolve(b), 'image/png')
    );
  }, []);

  const handleSaveOnly = useCallback(async () => {
    if (!isFormValid) {
      showNotification('Please fix all validation errors before saving', 'warning');
      markAllTouched();
      return;
    }

    try {
      showNotification('Saving avatar...', 'info');

      const avatarData = { ...formData } as any;
      let file: Blob | File | null = null;
      let fileName: string | null = null;

      if (hasNewImage && selectedImageFile) {
        file = selectedImageFile;
        fileName = `${formData.name || 'avatar'}-original.png`;
        avatarData.hasEncodedData = false;
      } else if (hasNewImage && selectedImage && canvasRef.current) {
        const blob = await buildFileFromCanvas();
        if (blob) {
          file = blob;
          fileName = `${formData.name || 'avatar'}-original.png`;
          avatarData.hasEncodedData = false;
        }
      }

      if (editMode && avatarId) {
        const updateData: any = { id: avatarId, ...avatarData };
        if (file && fileName) {
          updateData.file = file;
          updateData.fileName = fileName;
        }
        await updateAvatarMutation.mutateAsync(updateData);
        showNotification('Avatar data successfully updated!', 'success');
      } else {
        if (file) {
          await createAvatarMutation.mutateAsync({ formData: avatarData, file, fileName });
        } else {
          await createAvatarMutation.mutateAsync({ jsonData: avatarData });
        }
        showNotification('Avatar successfully saved!', 'success');
      }

      setHasNewImage(false);
      refreshAll();
      router.push('/avatars');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      showNotification(errorMessage, 'error');
      if (errorMessage.includes('Validation errors:')) {
        try {
          const validationErrors = JSON.parse(errorMessage.replace('Validation errors: ', ''));
          setFieldErrors(validationErrors);
        } catch {
          // ignore
        }
      }
    }
  }, [isFormValid, formData, hasNewImage, selectedImageFile, selectedImage, buildFileFromCanvas, editMode, avatarId, createAvatarMutation, updateAvatarMutation, refreshAll, router, markAllTouched, showNotification]);

  const handleSaveAndEncode = useCallback(async () => {
    if (!selectedImage) {
      showNotification('Please select an image first', 'warning');
      return;
    }
    if (!isFormValid) {
      showNotification('Please fix all validation errors before saving', 'warning');
      markAllTouched();
      return;
    }

    try {
      showNotification('Encoding avatar data into image...', 'info');

      let imageFile = selectedImageFile;
      if (!imageFile && selectedImage) {
        const response = await fetch(selectedImage);
        imageFile = new File([await response.blob()], 'image.png');
      }

      if (!imageFile) throw new Error('No image file available for encoding');

      const { blob, downloadUrl } = await encodeFormDataIntoImage(formData, imageFile as File);
      setEncodedImage(downloadUrl);
      showNotification('Saving avatar and uploading encoded image...', 'info');

      const fileName = `${formData.name || 'avatar'}-encoded.png`;
      const avatarData = { ...formData, hasEncodedData: true } as any;

      if (editMode && avatarId) {
        await updateAvatarMutation.mutateAsync({ id: avatarId, ...avatarData, file: blob, fileName });
        showNotification('Avatar successfully updated and encoded!', 'success');
      } else {
        await createAvatarMutation.mutateAsync({ formData: avatarData, file: blob, fileName });
        showNotification('Avatar successfully saved and encoded!', 'success');
      }

      setHasNewImage(false);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      showNotification(errorMessage, 'error');
      if (errorMessage.includes('Validation errors:')) {
        try {
          const validationErrors = JSON.parse(errorMessage.replace('Validation errors: ', ''));
          setFieldErrors(validationErrors);
        } catch {
          // ignore
        }
      }
    }
  }, [selectedImage, selectedImageFile, formData, isFormValid, editMode, avatarId, createAvatarMutation, updateAvatarMutation, showNotification, markAllTouched]);

  const handleDownload = useCallback(() => {
    if (!encodedImage) return;
    const a = document.createElement('a');
    a.href = encodedImage;
    a.download = `${formData.name || 'avatar'}-encoded.png`;
    a.click();
  }, [encodedImage, formData.name]);

  const handleDeleteAvatar = useCallback(async (id?: string) => {
    if (!id) return;
    try {
      await deleteAvatarMutation.mutateAsync(id);
      showNotification('Avatar and associated files deleted successfully!', 'success');
    } catch (err: any) {
      showNotification('Failed to delete avatar: ' + (err?.message ?? String(err)), 'error');
    } finally {
      router.push('/avatars');
    }
  }, [deleteAvatarMutation, router, showNotification]);

  // Memoized button disabled states
  const saveDisabled = useMemo(() => isLoadingAvatar || !isFormValid, [isLoadingAvatar, isFormValid]);
  const encodeDisabled = useMemo(() => !selectedImage || isLoadingAvatar || !isFormValid, [selectedImage, isLoadingAvatar, isFormValid]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/95 dark:to-indigo-900/20">
      <div className="max-w-4xl mx-auto p-4">
        <div className="space-y-4">
          <div className="text-center">
            <Link href="/avatars" className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-3">
              <HiArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Avatars</span>
            </Link>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{editMode ? 'Edit Avatar' : 'Avatar Creator'}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{editMode ? 'Update your avatar details and settings' : 'Create and save your avatar with steganography encoding'}</p>
          </div>

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

          <div className="space-y-3">
            <button onClick={handleSaveOnly} disabled={saveDisabled} className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 text-sm">
              <HiSave className="h-4 w-4" />
              <span>{isLoadingAvatar ? 'Saving...' : savedAvatarId ? 'Update Avatar Data' : 'Save Avatar Data Only'}</span>
            </button>

            <button onClick={handleSaveAndEncode} disabled={encodeDisabled} className="w-full bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg transition-colors font-medium text-sm">
              {isLoadingAvatar ? 'Processing...' : savedAvatarId ? 'Update & Encode to Image + Upload' : 'Save & Encode to Image + Upload'}
            </button>

            {!isFormValid && Object.keys(fieldErrors).length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <HiExclamationCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-yellow-800 dark:text-yellow-200 text-xs font-medium">Please fix validation errors before saving</p>
                </div>
                <ul className="mt-1 text-xs text-yellow-700 dark:text-yellow-300 space-y-0.5">
                  {Object.entries(fieldErrors).map(([field, error]) => (
                    <li key={field}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {encodedImage && (
              <button onClick={handleDownload} className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 text-sm">
                <HiDownload className="h-4 w-4" />
                <span>Download Encoded Image</span>
              </button>
            )}

            {savedAvatarId && (
              <button onClick={() => (showConfirmation ? handleDeleteAvatar(avatarId) : setShowConfirmation(true))} className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white px-6 py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 text-sm" disabled={isLoadingAvatar}>
                <HiTrash className="h-4 w-4" />
                <span>{isLoadingAvatar ? 'Deleting...' : showConfirmation ? 'Are you sure?' : 'Delete Avatar'}</span>
              </button>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={decodingCanvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
}
