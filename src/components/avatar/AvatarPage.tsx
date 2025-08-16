'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HiDownload, HiTrash, HiArrowLeft } from 'react-icons/hi';
import { AvatarForm, AvatarFormRef } from './AvatarForm';
import { AvatarFormData } from '@/utils/avatarValidation';
import { useNotification } from '@/contexts/NotificationContext';
import { useAvatar, useCreateAvatar, useUpdateAvatar, useDeleteAvatar, useRefreshAvatars } from '@/hooks/useAvatars';
import Link from 'next/link';
import { encodeFormDataIntoImage } from '@/utils/steganography';
import { useRouter } from 'next/navigation';

type AvatarPageProps = {
  editMode?: boolean;
  avatarId?: string;
};

export default function AvatarPage({ editMode = false, avatarId }: AvatarPageProps) {
  // Context / router
  const { showNotification } = useNotification();
  const router = useRouter();

  // Queries / mutations
  const { data: existingAvatar, isLoading: isLoadingAvatar } = useAvatar(editMode ? avatarId : undefined);
  const createAvatarMutation = useCreateAvatar();
  const updateAvatarMutation = useUpdateAvatar();
  const deleteAvatarMutation = useDeleteAvatar();
  const { refreshAll } = useRefreshAvatars();

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const decodingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const avatarFormRef = useRef<AvatarFormRef>(null);

  // Form state
  const [defaultValues, setDefaultValues] = useState<Partial<AvatarFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Avatar / UI state
  const [encodedImage, setEncodedImage] = useState<string | null>(null);
  const [savedAvatarId, setSavedAvatarId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentFormData, setCurrentFormData] = useState<AvatarFormData | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  // ---- Load existing avatar into form when editing ----
  useEffect(() => {
    if (!editMode) return;
    if (!existingAvatar || isLoadingAvatar) return;

    const avatarData = {
      name: existingAvatar.name || '',
      personality: existingAvatar.personality || '',
      backgroundKnowledge: existingAvatar.backgroundKnowledge || '',
      voiceModel: (existingAvatar.voiceModel as 'elevenlabs' | 'openai' | 'azure' | 'google') || 'elevenlabs',
    };

    setDefaultValues(avatarData);
    
    // Reset the form with existing data
    if (avatarFormRef.current) {
      avatarFormRef.current.reset(avatarData);
    }

    // Load existing image if available
    if (existingAvatar.imageUrl && existingAvatar.imageUrl !== '/placeholder-avatar.png') {
      setExistingImageUrl(existingAvatar.imageUrl);
    } else {
      setExistingImageUrl(null);
    }
  }, [editMode, existingAvatar, isLoadingAvatar]);

  // ---- Save avatarId in state for UI ----
  useEffect(() => {
    if (editMode && avatarId) setSavedAvatarId(avatarId);
  }, [editMode, avatarId]);

  // ---- Form submission handlers ----
  const handleFormSubmit = useCallback(async (data: AvatarFormData) => {
    setCurrentFormData(data);
    setIsSubmitting(true);
    await handleSaveOnly(data);
    setIsSubmitting(false);
  }, []);

  const handleFormSubmitAndEncode = useCallback(async (data: AvatarFormData) => {
    setCurrentFormData(data);
    setIsSubmitting(true);
    await handleSaveAndEncode(data);
    setIsSubmitting(false);
  }, []);

  const handleSaveOnly = useCallback(async (formData: AvatarFormData) => {
    try {
      showNotification('Saving avatar...', 'info');

      const avatarData = { 
        name: formData.name,
        personality: formData.personality,
        backgroundKnowledge: formData.backgroundKnowledge,
        voiceModel: formData.voiceModel,
      } as any;
      
      let file: File | null = formData.image || null;
      let fileName: string | null = null;

      if (file) {
        fileName = `${formData.name || 'avatar'}-original.png`;
        avatarData.hasEncodedData = false;
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
          await createAvatarMutation.mutateAsync({ formData: avatarData, file, fileName: fileName! });
        } else {
          await createAvatarMutation.mutateAsync({ jsonData: avatarData });
        }
        showNotification('Avatar successfully saved!', 'success');
      }

      refreshAll();
      router.push('/avatars');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      showNotification(errorMessage, 'error');
    }
  }, [editMode, avatarId, createAvatarMutation, updateAvatarMutation, refreshAll, router, showNotification]);

  const handleSaveAndEncode = useCallback(async (formData: AvatarFormData) => {
    if (!formData.image) {
      showNotification('Please select an image first', 'warning');
      return;
    }

    try {
      showNotification('Encoding avatar data into image...', 'info');

      const formDataToEncode = {
        name: formData.name,
        personality: formData.personality,
        backgroundKnowledge: formData.backgroundKnowledge,
        voiceModel: formData.voiceModel,
      };

      const { blob, downloadUrl } = await encodeFormDataIntoImage(formDataToEncode, formData.image);
      setEncodedImage(downloadUrl);
      showNotification('Saving avatar and uploading encoded image...', 'info');

      const fileName = `${formData.name || 'avatar'}-encoded.png`;
      const avatarData = { ...formDataToEncode, hasEncodedData: true } as any;

      if (editMode && avatarId) {
        await updateAvatarMutation.mutateAsync({ id: avatarId, ...avatarData, file: new File([blob], fileName), fileName });
        showNotification('Avatar successfully updated and encoded!', 'success');
      } else {
        await createAvatarMutation.mutateAsync({ formData: avatarData, file: new File([blob], fileName), fileName });
        showNotification('Avatar successfully saved and encoded!', 'success');
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      showNotification(errorMessage, 'error');
    }
  }, [editMode, avatarId, createAvatarMutation, updateAvatarMutation, showNotification]);

  const handleDownload = useCallback(() => {
    if (!encodedImage) return;
    const a = document.createElement('a');
    a.href = encodedImage;
    a.download = `${currentFormData?.name || 'avatar'}-encoded.png`;
    a.click();
  }, [encodedImage, currentFormData?.name]);

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
            ref={avatarFormRef}
            onSubmit={handleFormSubmit}
            defaultValues={defaultValues}
            isSubmitting={isSubmitting}
            existingImageUrl={existingImageUrl}
            editMode={editMode}
          />

          {currentFormData && (
            <div className="space-y-3">
              <button 
                onClick={() => handleFormSubmitAndEncode(currentFormData)} 
                disabled={isSubmitting || !currentFormData.image} 
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg transition-colors font-medium text-sm"
              >
                {isSubmitting ? 'Processing...' : savedAvatarId ? 'Update & Encode to Image + Upload' : 'Save & Encode to Image + Upload'}
              </button>
            </div>
          )}

          <div className="space-y-3">
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