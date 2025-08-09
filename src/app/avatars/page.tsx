'use client';

import React, { useEffect } from 'react';
import { HiUser } from 'react-icons/hi';
import ConfirmationModal from '@/components/ConformationModal';
import { AvatarCard } from '@/components/avatars/AvatarCard';
import { CreateAvatarCard } from '@/components/avatars/CreateAvatarCard';
import EmptyState from '@/components/avatars/EmptyState';
import LoadingState from '@/components/avatars/LoadingState';
import { Avatar } from '../../types/avatar';
import { useModal } from '@/hooks/useModal';
import { useNotification } from '@/contexts/NotificationContext';
import { useAvatars, useDeleteAvatar, useActiveAvatar } from '@/hooks/useAvatars';

const Avatars: React.FC = () => {
  // ====== Hooks & Context ======
  const { showNotification, hideNotification, notification } = useNotification();
  const { activeAvatarId, setActiveAvatarId } = useActiveAvatar();
  const useConfirmModal = useModal();
  const useDeleteConfirmModal = useModal();

  // ====== Data Fetching (TanStack Query) ======
  const { data: avatars = [], isLoading, error, refetch } = useAvatars();
  const deleteAvatarMutation = useDeleteAvatar();

  // Load active avatar from localStorage
  useEffect(() => {
    const savedActiveAvatar = localStorage.getItem('activeAvatarId');
    if (savedActiveAvatar) {
      setActiveAvatarId(savedActiveAvatar);
    }
  }, []);

  const handleUseAvatarClick = (avatarId: string) => {
    useConfirmModal.openModal(avatarId);
  };

  const confirmUseAvatar = () => {
    if (useConfirmModal.data) {
      localStorage.setItem('activeAvatarId', useConfirmModal.data);
    }
    useConfirmModal.closeModal();
  };

  const handleDeleteAvatar = (e: React.MouseEvent, avatarId: string) => {
    e.stopPropagation();
    useDeleteConfirmModal.data = avatarId;
  };

  const confirmDelete = async () => {
    if (!useDeleteConfirmModal.data) return;

    try {
      await deleteAvatarMutation.mutateAsync(useDeleteConfirmModal.data);

      if (activeAvatarId === useDeleteConfirmModal.data) {
        setActiveAvatarId(null);
      }

      useDeleteConfirmModal.closeModal();
      showNotification('Avatar deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting avatar:', err);
      showNotification(
        err instanceof Error ? err.message : 'Failed to delete avatar. Please try again.',
        'error'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/95 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-full mb-4 shadow-lg">
            <HiUser className="w-8 h-8 text-white" />
          </div> */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Choose Your Avatar
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Select from your existing avatars or create a new one to begin your journey
          </p>
        </div>

        {/* Grid Section */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
            <CreateAvatarCard />

            {isLoading && <LoadingState />}

            {!isLoading &&
              avatars.map((avatar) => (
                <AvatarCard
                  key={avatar.id}
                  avatar={avatar}
                  avatarToDeleteId={useDeleteConfirmModal.data}
                  isActive={activeAvatarId === avatar.id}
                  onDelete={handleDeleteAvatar}
                  onUse={handleUseAvatarClick}
                  onConfirm={confirmDelete}
                />
              ))}

            {/* Empty State */}
            {!isLoading && avatars.length === 0 && (
              <div className="col-span-full">
                <EmptyState />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Use Avatar Confirmation Modal */}
      {useConfirmModal.isOpen && (
        <ConfirmationModal
          isOpen={useConfirmModal.isOpen}
          avatarToConfirm={useConfirmModal.data}
          onConfirm={confirmUseAvatar}
          onCancel={useConfirmModal.closeModal}
        />
      )}
    </div>
  );
};

export default Avatars;