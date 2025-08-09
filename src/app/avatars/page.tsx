'use client';

import React, { useState, useEffect } from 'react';
import { HiUser } from 'react-icons/hi';
import DeleteModal from '@/components/DeleteModal';
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

  // ====== Modal & UI State ======
  const [avatarToConfirmUseId, setAvatarToConfirmUseId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load active avatar from localStorage
  useEffect(() => {
    const savedActiveAvatar = localStorage.getItem('activeAvatarId');
    if (savedActiveAvatar) {
      setActiveAvatarId(savedActiveAvatar);
    }
  }, []);

  const handleUseAvatarClick = (avatarId: string) => {
    setAvatarToConfirmUseId(avatarId);
    useConfirmModal.openModal(avatarId);
  };

  const confirmUseAvatar = () => {
    if (avatarToConfirmUseId) {
      setActiveAvatarId(avatarToConfirmUseId);


      // Save to localStorage for persistence
      localStorage.setItem('activeAvatarId', avatarToConfirmUseId);

      // You might want to also save this to a user preferences API
      // saveUserPreference('activeAvatarId', avatarToConfirmUseId);
    }
    useConfirmModal.closeModal();
    setAvatarToConfirmUseId(null);
  };

  const cancelUseAvatar = () => {
    useConfirmModal.closeModal();
    setAvatarToConfirmUseId(null);

  };

  const handleDeleteAvatar = (e: React.MouseEvent, avatarId: string) => {
    e.stopPropagation();
    useDeleteConfirmModal.openModal(avatarId);
  };
  const confirmDelete = async () => {
    if (!useDeleteConfirmModal.data) return;

    try {
      await deleteAvatarMutation.mutateAsync(useDeleteConfirmModal.data);

      // Clear active avatar if it was the deleted one
      if (activeAvatarId === useDeleteConfirmModal.data) {
        setActiveAvatarId(null);
      }

      showNotification('Avatar deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting avatar:', err);
      showNotification(
        err instanceof Error ? err.message : 'Failed to delete avatar. Please try again.',
        'error'
      );
    } finally {
      useDeleteConfirmModal.closeModal();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
            <HiUser className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Avatar
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Select from your existing avatars or create a new one to begin your journey
          </p>

          {/* Refresh Button */}
          {/* <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button> */}
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
          <CreateAvatarCard />
          {isLoading && <LoadingState />}
          {!isLoading &&
            avatars.map((avatar) => (
              <AvatarCard
                key={avatar.id}
                avatar={avatar}
                isActive={activeAvatarId === avatar.id}
                onDelete={handleDeleteAvatar}
                onUse={handleUseAvatarClick}
              />
            ))}


          {/* Empty State */}
          {!isLoading && avatars.length === 0 && (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Use Avatar Confirmation Modal */}
      {useConfirmModal.isOpen && (
        <ConfirmationModal
          isOpen={useConfirmModal.isOpen}
          avatarToConfirm={avatars.find(a => a.id === avatarToConfirmUseId)}
          onConfirm={confirmUseAvatar}
          onCancel={cancelUseAvatar}
        />
      )}
      {/* Delete Confirmation Modal */}
      {useDeleteConfirmModal.isOpen && (
        <DeleteModal
          avatars={avatars}
          avatarToDeleteId={useDeleteConfirmModal.data}
          isDeleting={isDeleting}
          onCancel={useDeleteConfirmModal.closeModal}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
export default Avatars;