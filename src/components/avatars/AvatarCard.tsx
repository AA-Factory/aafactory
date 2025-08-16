// components/AvatarCard/AvatarCard.tsx
import React, { useState } from 'react';
import { HiPencil, HiTrash, HiMicrophone, HiCheck, HiX, HiPlus, HiMinus } from 'react-icons/hi';
import { Avatar } from '../../types/avatar';
import { AVATAR_CONSTANTS } from '../../constants/avatar';
import { useActiveAvatars } from '@/contexts/ActiveAvatarsContext';
import Link from 'next/link';

interface AvatarCardProps {
  avatar: Avatar;
  avatarToDeleteId?: string | null;
  onDelete: (e: React.MouseEvent, avatarId: string) => void;
  onConfirm: () => void;
}

export const AvatarCard: React.FC<AvatarCardProps> = ({
  avatar,
  avatarToDeleteId,
  onDelete,
  onConfirm
}) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isAvatarActive, toggleActiveAvatar } = useActiveAvatars();

  const isActive = isAvatarActive(avatar.id);
  const isInDeleteMode = avatarToDeleteId === avatar.id;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = AVATAR_CONSTANTS.FALLBACK_IMAGE;
  };

  const handleToggleActive = () => {
    toggleActiveAvatar(avatar.id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirmation(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(e, avatar.id);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    onConfirm();
  };

  // Use delete confirmation from props if available, otherwise use local state
  const showDeleteConfirm = isInDeleteMode || showDeleteConfirmation;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 group relative h-full flex flex-col
    ${isActive
          ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600'
        }`}
    >
      <div className="text-center relative">
        {/* Active Avatar Badge - Top Left */}
        {isActive && (
          <div className="absolute -top-2 -left-2 z-10">
            <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
              <HiCheck className="w-3 h-3" />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute -top-1 -right-1 flex items-center space-x-1">
          {/* Edit button - slides left when delete confirmation shows */}
          <Link
            href={`/avatar/${avatar.id}`}
            className={`w-7 h-7 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${showDeleteConfirm ? 'transform -translate-x-2 opacity-40' : 'transform translate-x-0 opacity-100'
              }`}
            title="Edit Avatar"
          >
            <HiPencil className="w-3 h-3 text-white" />
          </Link>

          {/* Delete button that stretches */}
          <div
            className={`bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 rounded-full shadow-lg transition-all duration-300 ease-out overflow-hidden ${showDeleteConfirm
              ? 'w-36 h-7'
              : 'w-7 h-7'
              }`}
          >
            {!showDeleteConfirm ? (
              // Initial delete icon
              <button
                onClick={handleDeleteClick}
                className="w-full h-full flex items-center justify-center transition-colors"
                title="Delete Avatar"
              >
                <HiTrash className="w-3 h-3 text-white" />
              </button>
            ) : (
              // Confirmation content inside stretched button
              <div className="w-full h-full flex items-center justify-between px-2 z-20">
                <span className="text-xs text-white whitespace-nowrap font-medium">
                  Are you sure?
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleCancelDelete}
                    className="w-4 h-4 bg-white bg-opacity-20 hover:bg-opacity-30 dark:bg-black dark:bg-opacity-20 dark:hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
                    title="Cancel"
                  >
                    <HiX className="w-2 h-2 text-amber-950 dark:text-amber-300" />
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="w-4 h-4 bg-white text-amber-800 bg-opacity-20 hover:bg-opacity-30 dark:bg-black dark:bg-opacity-20 dark:hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
                    title="Confirm Delete"
                  >
                    {isDeleting ? (
                      <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <HiTrash className="w-2 h-2 text-amber-950 dark:text-amber-300" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <img
          src={avatar.imageUrl}
          alt={avatar.name}
          className="w-14 h-14 rounded-full mx-auto object-cover mb-3 transition-transform"
          onError={handleImageError}
        />

        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {avatar.name}
        </h3>

        <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-center">
            <HiMicrophone className="w-3 h-3 mr-1" />
            {avatar.voiceModel}
          </div>
          {avatar.hasEncodedData && (
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
              Encoded
            </div>
          )}
          <div className="text-center pt-1 border-t border-gray-100 dark:border-gray-700">
            Created {avatar.createdAt}
          </div>
        </div>

        {/* Toggle Active Avatar Button */}
        <button
          onClick={handleToggleActive}
          className={`mt-3 w-full py-1 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${isActive
            ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 text-white'
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white'
            }`}
          disabled={isDeleting}
        >
          {isActive ? (
            <>
              <HiMinus className="w-4 h-4" />
              Remove from Active
            </>
          ) : (
            <>
              <HiPlus className="w-4 h-4" />
              Add to Active
            </>
          )}
        </button>

        {/* Active Status Badge */}
        {/* {isActive && (
          <div className="mt-2 inline-flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-3 py-1 rounded-full">
            <HiCheck className="w-3 h-3 mr-1" />
            Active Avatar
          </div>
        )} */}
      </div>
    </div>
  );
};