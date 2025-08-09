import React from 'react';
import { HiUser } from 'react-icons/hi';

const ConfirmationModal = ({
  isOpen,
  avatarToConfirm,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !avatarToConfirm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 dark:bg-black dark:bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all duration-300 scale-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
            <HiUser className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Use {avatarToConfirm.name}?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">
            This will set {avatarToConfirm.name} as your active avatar for conversations.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;