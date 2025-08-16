// components/avatars/AvatarGrid.tsx
import React from 'react';
import { Avatar } from '../../types/avatar';
import { AvatarCard } from './AvatarCard';
import { CreateAvatarCard } from './CreateAvatarCard';
import { LoadingCards } from '../LoadingCards/LoadingCards';
import EmptyState from './EmptyState';

interface AvatarGridProps {
  avatars: Avatar[];
  activeAvatarId: string | null;
  loading: boolean;
  onCreateNew: () => void;
  onEdit: (avatarId: string) => void;
  onDelete: (avatarId: string) => void;
  onUse: (avatarId: string) => void;
}

export const AvatarGrid: React.FC<AvatarGridProps> = ({
  avatars,
  activeAvatarId,
  loading,
  onCreateNew,
  onEdit,
  onDelete,
  onUse,
}) => {
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <CreateAvatarCard onClick={onCreateNew} />

      {loading && <LoadingCards count={6} />}

      {!loading &&
        avatars.map((avatar) => (
          <AvatarCard
            key={avatar.id}
            avatar={avatar}
            isActive={activeAvatarId === avatar.id}
            onEdit={onEdit}
            onDelete={onDelete}
            onUse={onUse}
          />
        ))}

      {!loading && avatars.length === 0 && (
        <EmptyState onCreateNew={onCreateNew} />
      )}
    </div>
  );
};