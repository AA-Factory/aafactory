'use client';

import React, { useEffect, useState } from 'react';
import { HiUser } from 'react-icons/hi';
import ConfirmationModal from '@/components/ConformationModal';
import { AvatarCard } from '@/components/avatars/AvatarCard';
import { CreateAvatarCard } from '@/components/avatars/CreateAvatarCard';
import EmptyState from '@/components/avatars/EmptyState';
import LoadingState from '@/components/avatars/LoadingState';
import { ActiveAvatarsDisplay } from '@/components/avatars/ActiveAvatarsDisplay';
import { Avatar } from '../../types/avatar';
import { useModal } from '@/hooks/useModal';
import { useNotification } from '@/contexts/NotificationContext';
import { useAvatars, useDeleteAvatar } from '@/hooks/useAvatars';
import { useActiveAvatars } from '@/contexts/ActiveAvatarsContext';

const Avatars: React.FC = () => {
  // ====== Hooks & Context ======
  const { showNotification, hideNotification, notification } = useNotification();
  const {
    activeAvatarIds,
    toggleActiveAvatar,
    removeActiveAvatar,
    isAvatarActive
  } = useActiveAvatars();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  // ====== Data Fetching (TanStack Query) ======
  const { data: avatars = [], isLoading, error, refetch } = useAvatars();
  const deleteAvatarMutation = useDeleteAvatar();

  const handleDeleteAvatar = (e: React.MouseEvent, avatarId: string) => {
    e.stopPropagation();
    setSelectedAvatar(avatarId);
  };

  const confirmDelete = async () => {
    if (!selectedAvatar) return;

    try {
      await deleteAvatarMutation.mutateAsync(selectedAvatar);

      // Remove from active avatars if it was active
      if (isAvatarActive(selectedAvatar)) {
        removeActiveAvatar(selectedAvatar);
      }


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
        {/* Header Section with Active Avatars Display */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Choose Your Avatars
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Select multiple avatars to be active at once. Click on avatars to add or remove them from your active selection.
          </p>

          {/* Active Avatars Display */}
          {/* {activeAvatarIds.length > 0 && (
            <div className="flex justify-center mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg px-6 py-4 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-4">
                    Active Avatars:
                  </span>
                  <ActiveAvatarsDisplay size="md" maxDisplay={8} />
                </div>
              </div>
            </div>
          )} */}
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
                  avatarToDeleteId={selectedAvatar}
                  onDelete={handleDeleteAvatar}
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

        {/* Active Avatars Summary */}
        {/* {activeAvatarIds.length > 0 && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-blue-700 dark:text-blue-300 font-medium">
                {activeAvatarIds.length} avatar{activeAvatarIds.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Avatars;