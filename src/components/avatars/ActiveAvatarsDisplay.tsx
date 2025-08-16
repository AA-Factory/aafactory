'use client';

import React from 'react';
import { useActiveAvatars } from '@/contexts/ActiveAvatarsContext';
import { useAvatars } from '@/hooks/useAvatars';
import { Avatar } from '../../types/avatar';

interface ActiveAvatarsDisplayProps {
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12'
};

const overlapClasses = {
  sm: '-ml-2',
  md: '-ml-3',
  lg: '-ml-4'
};

export const ActiveAvatarsDisplay: React.FC<ActiveAvatarsDisplayProps> = ({
  maxDisplay = 5,
  size = 'md',
  className = ''
}) => {
  const { activeAvatarIds } = useActiveAvatars();
  const { data: avatars = [] } = useAvatars();

  // Filter avatars to only include active ones
  const activeAvatars = avatars.filter(avatar => activeAvatarIds.includes(avatar.id));

  if (activeAvatars.length === 0) {
    return null;
  }

  const displayAvatars = activeAvatars.slice(0, maxDisplay);
  const remainingCount = activeAvatars.length - maxDisplay;

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center">
        {displayAvatars.map((avatar, index) => (
          <div
            key={avatar.id}
            className={`
              ${sizeClasses[size]} 
              ${index > 0 ? overlapClasses[size] : ''}
              relative rounded-full border-2 border-white dark:border-gray-800 shadow-lg
              hover:z-10 transition-all duration-200 hover:scale-110
            `}
            style={{ zIndex: displayAvatars.length - index }}
            title={avatar.name}
          >
            {avatar.imageUrl ? (
              <img
                src={avatar.imageUrl}
                alt={avatar.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {avatar.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        ))}

        {remainingCount > 0 && (
          <div
            className={`
              ${sizeClasses[size]} 
              ${overlapClasses[size]}
              relative rounded-full border-2 border-white dark:border-gray-800 shadow-lg
              bg-gray-100 dark:bg-gray-700 flex items-center justify-center
            `}
            style={{ zIndex: 0 }}
            title={`+${remainingCount} more avatars`}
          >
            <span className="text-gray-600 dark:text-gray-300 font-semibold text-xs">
              +{remainingCount}
            </span>
          </div>
        )}
      </div>

      {/* {activeAvatars.length > 0 && (
        <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">
          {activeAvatars.length} active avatar{activeAvatars.length !== 1 ? 's' : ''}
        </span>
      )} */}
    </div>
  );
};