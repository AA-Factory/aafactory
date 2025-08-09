'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AvatarPage from '@/components/AvatarPage';

const AvatarEdit: React.FC = () => {
  const searchParams = useSearchParams();
  const avatarId = searchParams.get('id');

  useEffect(() => {
    // Redirect to avatars page if no ID provided
    if (!avatarId) {
      window.location.href = '/avatars';
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