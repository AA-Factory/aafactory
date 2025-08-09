// components/avatars/CreateAvatarCard.tsx
import React from 'react';
import { HiPlus, HiCamera, HiHeart, HiMicrophone } from 'react-icons/hi';
import Link from 'next/link';

export const CreateAvatarCard: React.FC = () => {
  return (
    <Link href="/avatar/create" className="group">
      <div className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-600 h-full flex flex-col">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
            <HiPlus className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Create New Avatar
          </h3>
          <div className="space-y-1.5">
            <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              <HiCamera className="w-3 h-3 mr-2" />
              Upload image
            </div>
            <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              <HiHeart className="w-3 h-3 mr-2" />
              Define personality
            </div>
            <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              <HiMicrophone className="w-3 h-3 mr-2" />
              Choose voice model
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};