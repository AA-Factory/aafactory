'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AvatarPage from '@/components/avatar/AvatarPage';
import { useRouter } from 'next/navigation' // NOT 'next/router'


interface AvatarEditProps {
  params: {
    id: string;
  };
}

const AvatarEdit: React.FC<AvatarEditProps> = ({ params }) => {
  const avatarId = params.id;
  const router = useRouter();
  useEffect(() => {
    // Redirect to avatars page if no ID provided
    if (!avatarId) {
      router.push('/avatars');
    }
  }, [avatarId]);

  if (!avatarId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Avatar ID</h2>
          <p className="text-gray-600 mb-6">Redirecting to avatars page...</p>
        </div>
      </div>
    );
  }

  return <AvatarPage editMode={true} avatarId={avatarId} />;
};

export default AvatarEdit;