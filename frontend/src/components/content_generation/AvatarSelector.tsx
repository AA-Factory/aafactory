import React from 'react';
import { useAvatars } from '@/hooks/use-avatars';
import { Avatar } from '@/lib/types/avatar';
import { Tooltip } from '@/components/ui/Tooltip';

interface AvatarSelectorProps {
  selectedAvatar: Avatar | null;
  setAvatar: (avatar: Avatar | null) => void;
  tooltip?: string;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedAvatar,
  setAvatar,
  tooltip = '',
}) => {
  const { data: avatars, isLoading } = useAvatars();
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <h2 className="text-lg font-bold mb-1 dark:text-white">
          Select Avatar
        </h2>
        <Tooltip text={tooltip} />
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 overflow-scroll">
          {avatars?.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setAvatar(avatar)}
              className={`rounded-lg border-2 flex flex-col items-center p-3 space-y-2 transition-all w-full max-h-fit ${
                selectedAvatar?.id === avatar.id
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
              }`}
            >
              <img
                src={`/api/file/image/${avatar.fileName}`}
                alt={avatar.name}
                className="w-14 h-14 object-cover rounded-full"
              />
              <span className="font-semibold dark:text-white">
                {avatar.name}
              </span>
            </button>
          )) || []}
        </div>
      )}
    </div>
  );
};
