import React from 'react';
import { HiUser } from 'react-icons/hi';
import Link from 'next/link'
const EmptyState = () => {
  return (
    <div className="col-span-full text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <HiUser className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No avatars found</h3>
      <p className="text-gray-600 mb-6">Create your first avatar to get started</p>
      <Link href="/avatar/create" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
        Create Your First Avatar
      </Link>
    </div>
  );
};

export default EmptyState;