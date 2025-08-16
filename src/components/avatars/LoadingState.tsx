import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <>
      {/* Loading Cards */}
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse"
        >
          {/* Image Skeleton */}
          <div className="aspect-square bg-gray-200 dark:bg-gray-700" />

          {/* Content Skeleton */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4" />

            {/* Description */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-full" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-2/3" />
            </div>

            {/* Button Skeleton */}
            <div className="flex space-x-2 pt-1">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex-1" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default LoadingState;