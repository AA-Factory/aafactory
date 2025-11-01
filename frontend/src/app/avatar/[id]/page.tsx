'use client';

import React, { useEffect, use } from 'react'; // ✅ Import 'use' hook
import AvatarPage from '@/components/avatar/AvatarPage';
import { useRouter } from 'next/navigation';

interface AvatarEditProps {
  params: Promise<{
    // ✅ params is a Promise
    id: string;
  }>;
}

const AvatarEdit: React.FC<AvatarEditProps> = ({ params }) => {
  const { id: avatarId } = use(params); // ✅ Use 'use()' to unwrap the Promise
  const router = useRouter();

  useEffect(() => {
    // Redirect to avatars page if no ID provided
    if (!avatarId) {
      router.push('/avatars');
    }
  }, [avatarId, router]);

  if (!avatarId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Invalid Avatar ID
          </h2>
          <p className="text-gray-600 mb-6">Redirecting to avatars page...</p>
        </div>
      </div>
    );
  }

  return <AvatarPage editMode={true} avatarId={avatarId} />;
};

export default AvatarEdit;
