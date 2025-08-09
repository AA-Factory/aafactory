// components/AvatarCard/AvatarCard.tsx
import React from 'react';
import { HiPencil, HiTrash, HiMicrophone, HiCheck } from 'react-icons/hi';
import { Avatar } from '../../types/avatar';
import { AVATAR_CONSTANTS } from '../../constants/avatar';
import Link from 'next/link'
interface AvatarCardProps {
  avatar: Avatar;
  isActive: boolean;
  onDelete: (event: React.MouseEvent, avatarId: string) => void;
  onUse: (avatarId: string) => void;
}

export const AvatarCard: React.FC<AvatarCardProps> = ({
  avatar,
  isActive,
  onDelete,
  onUse,
}) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = AVATAR_CONSTANTS.FALLBACK_IMAGE;
  };

  return (
    <div
      className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 group relative ${isActive
        ? 'border-green-500 bg-green-50'
        : 'border-gray-100 hover:border-blue-200'
        }`}
    >
      <div className="text-center relative">
        {/* Action buttons */}
        <div className="absolute -top-2 -right-2 flex space-x-1">
          <Link href={`/avatar/${avatar.id}`} className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-colors" title="Edit Avatar">
            <HiPencil className="w-4 h-4 text-white" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(e, avatar.id);
            }}
            className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
            title="Delete Avatar"
          >
            <HiTrash className="w-4 h-4 text-white" />
          </button>
        </div>

        <img
          src={avatar.imageUrl}
          alt={avatar.name}
          className="w-16 h-16 rounded-full mx-auto object-cover mb-4 group-hover:scale-105 transition-transform"
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
