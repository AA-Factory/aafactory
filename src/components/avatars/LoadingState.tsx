import React from 'react';

const LoadingState = ({ count = 6 }) => {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-pulse">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export default LoadingState;