// components/avatars/CreateAvatarCard.tsx
import React from 'react';
import { HiPlus, HiCamera, HiHeart, HiMicrophone } from 'react-icons/hi';
import Link from 'next/link'

export const CreateAvatarCard: React.FC = () => {
  return (
    <Link href="/avatar/create" className="group" >
      <div

        className="group cursor-pointer bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 group-hover:bg-purple-200 transition-colors">
            <HiPlus className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Create New Avatar
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <HiCamera className="w-3 h-3 mr-2" />
              Upload image
            </div>
            <div className="flex items-center justify-center text-xs text-gray-500">
              <HiHeart className="w-3 h-3 mr-2" />
              Define personality
            </div>
            <div className="flex items-center justify-center text-xs text-gray-500">
              <HiMicrophone className="w-3 h-3 mr-2" />
              Choose voice model
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};