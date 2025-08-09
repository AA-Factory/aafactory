import React from 'react';
import { HiTrash, HiRefresh } from 'react-icons/hi';

interface Avatar {
  id: string;
  name: string;
}

interface DeleteModalProps {
  avatars: Avatar[];
  avatarToDeleteId: string | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  avatars = [],
  avatarToDeleteId,
  isDeleting,
  onCancel,
  onConfirm
}) => {
  if (!avatarToDeleteId) return null;

  const avatarToDelete = avatars.find(a => a.id === avatarToDeleteId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <HiTrash className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Delete {avatarToDelete?.name}?
          </h3>
          <p className="text-gray-600 mb-8">
            This action cannot be undone. The avatar and its associated files will be permanently removed from the database.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isDeleting ? (
                <>
                  <HiRefresh className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;