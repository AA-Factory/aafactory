// components/AvatarCard/AvatarCard.tsx
import React, { useState } from 'react';
import { HiPencil, HiTrash, HiMicrophone, HiCheck, HiX } from 'react-icons/hi';
import { Avatar } from '../../types/avatar';
import { AVATAR_CONSTANTS } from '../../constants/avatar';
import Link from 'next/link';

interface AvatarCardProps {
  avatar: Avatar;
  avatarToDeleteId: string | null;
  isActive: boolean;
  onDelete: (e: React.MouseEvent, avatarId: string) => void;
  onUse: (avatarId: string) => void;
  onConfirm: () => void;
}

export const AvatarCard: React.FC<AvatarCardProps> = ({
  avatar,
  isActive,
  onDelete,
  onUse,
  onConfirm
}) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = AVATAR_CONSTANTS.FALLBACK_IMAGE;
  };


  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirmation(false);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 group relative h-full flex flex-col
    ${isActive
          ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
          : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600'
        }`}
    >
      <div className="text-center relative">
        {/* Action buttons */}
        <div className="absolute -top-1 -right-1 flex items-center space-x-1">
          {/* Edit button - slides left when delete confirmation shows */}
          <Link
            href={`/avatar/${avatar.id}`}
            className={`w-7 h-7 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${showDeleteConfirmation ? 'transform -translate-x-2 opacity-40' : 'transform translate-x-0 opacity-100'
              }`}
            title="Edit Avatar"
          >
            <HiPencil className="w-3 h-3 text-white" />
          </Link>

          {/* Delete button that stretches */}
          <div
            className={`bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 rounded-full shadow-lg transition-all duration-300 ease-out overflow-hidden ${showDeleteConfirmation
              ? 'w-36 h-7'
              : 'w-7 h-7'
              }`}
          >
            {!showDeleteConfirmation ? (
              // Initial delete icon
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(e, avatar.id);
                  setShowDeleteConfirmation(true);
                }}
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
                    onClick={onConfirm}
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

        {/* Use This Avatar Button */}
        {!isActive && (
          <button
            onClick={() => onUse(avatar.id)}
            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            disabled={isDeleting}
          >
            Use This Avatar
          </button>
        )}

        {/* Currently Selected Badge */}
        {isActive && (
          <div className="mt-2 inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium px-3 py-1 rounded-full">
            <HiCheck className="w-3 h-3 mr-1" />
            Currently Selected
          </div>
        )}
      </div>
    </div>
  );
};