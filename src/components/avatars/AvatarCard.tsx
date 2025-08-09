// components/AvatarCard/AvatarCard.tsx
import React, { useState } from 'react';
import { HiPencil, HiTrash, HiMicrophone, HiCheck, HiX } from 'react-icons/hi';
import { Avatar } from '../../types/avatar';
import { AVATAR_CONSTANTS } from '../../constants/avatar';
import Link from 'next/link'

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
  avatarToDeleteId,
  isActive,
  onDelete,
  onUse,
  onConfirm
}) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  console.log('✌️sDeleting, --->', isDeleting,);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = AVATAR_CONSTANTS.FALLBACK_IMAGE;
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();

  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(e, avatar.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirmation(false);
  };

  return (
    <div
      className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 group relative h-full flex flex-col
    ${isActive
          ? 'border-green-500 bg-green-50'
          : 'border-gray-100 hover:border-blue-200'
        }`}
    >
      <div className="text-center relative">
        {/* Action buttons */}
        <div className="absolute -top-2 -right-2 flex items-center space-x-1">
          {/* Edit button - slides left when delete confirmation shows */}
          <Link
            href={`/avatar/${avatar.id}`}
            className={`w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${showDeleteConfirmation ? 'transform -translate-x-2 opacity-40' : 'transform translate-x-0 opacity-100'
              }`}
            title="Edit Avatar"
          >
            <HiPencil className="w-4 h-4 text-white" />
          </Link>

          {/* Delete button that stretches */}
          <div
            className={`bg-red-500 hover:bg-red-600 rounded-full shadow-lg transition-all duration-300 ease-out overflow-hidden ${showDeleteConfirmation
              ? 'w-40 h-8'
              : 'w-8 h-8'
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
                disabled={isDeleting}
              >
                <HiTrash className="w-4 h-4 text-white" />
              </button>
            ) : (
              // Confirmation content inside stretched button
              <div className="w-full h-full flex items-center justify-between px-3 z-20">
                <span className="text-xs text-white whitespace-nowrap font-medium">
                  Are you sure?
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleCancelDelete}
                    className="w-5 h-5 bg-amber-950 bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
                    title="Cancel"
                    disabled={isDeleting}
                  >
                    <HiX className="w-3 h-3 text-white" />
                  </button>
                  <button
                    onClick={onConfirm}
                    className="w-5 h-5 bg-amber-950 bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
                    title="Confirm Delete"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <HiTrash className="w-3 h-3 text-white" />
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
          className="w-16 h-16 rounded-full mx-auto object-cover mb-4  transition-transform"
          onError={handleImageError}
        />

        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {avatar.name}
        </h3>

        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex items-center justify-center">
            <HiMicrophone className="w-3 h-3 mr-1" />
            {avatar.voiceModel}
          </div>
          {avatar.hasEncodedData && (
            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Encoded
            </div>
          )}
          <div className="text-center pt-2 border-t border-gray-100">
            Created {avatar.createdAt}
          </div>
        </div>

        {/* Use This Avatar Button */}
        {!isActive && (
          <button
            onClick={() => onUse(avatar.id)}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            disabled={isDeleting}
          >
            Use This Avatar
          </button>
        )}

        {/* Currently Selected Badge */}
        {isActive && (
          <div className="mt-3 inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
            <HiCheck className="w-3 h-3 mr-1" />
            Currently Selected
          </div>
        )}
      </div>
    </div>
  );
};