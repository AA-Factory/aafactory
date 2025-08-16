import React from 'react';
import { HiUser } from 'react-icons/hi';
import Link from 'next/link';

const EmptyState = () => {
  return (
    <div className="col-span-full text-center py-8">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
        <HiUser className="w-7 h-7 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No avatars found</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">Create your first avatar to get started</p>
      <Link
        href="/avatar/create"
        className="inline-block bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors text-sm"
      >
        Create Your First Avatar
      </Link>
    </div>
  );
};

export default EmptyState;