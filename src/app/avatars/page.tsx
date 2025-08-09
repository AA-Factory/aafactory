'use client';

import React, { useState, useEffect } from 'react';
import { HiExclamationCircle, HiUser, HiRefresh, HiPlus, HiCamera, HiHeart, HiMicrophone, HiPencil, HiTrash, HiCheck } from 'react-icons/hi';

interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  voiceModel: string;
  createdAt: string;
  personality: string;
  backgroundKnowledge: string;
  hasEncodedData?: boolean;
  fileName?: string;
}

const Avatars: React.FC = () => {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [activeAvatarId, setActiveAvatarId] = useState<string | null>(null);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showUseConfirmModal, setShowUseConfirmModal] = useState(false);
  const [avatarToConfirmUseId, setAvatarToConfirmUseId] = useState<string | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [avatarToDeleteId, setAvatarToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch avatars from database
  const fetchAvatars = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/avatars');
      if (!response.ok) {
        throw new Error('Failed to fetch avatars');
      }

      const data = await response.json();

      // Map database schema to component interface
      const mappedAvatars: Avatar[] = data.avatars.map((avatar: any) => ({
        id: avatar._id,
        name: avatar.name || 'Unnamed Avatar',
        imageUrl: avatar.src || '/placeholder-avatar.png', // Fallback image
        voiceModel: avatar.voiceModel || 'elevenlabs',
        createdAt: new Date(avatar.createdAt).toLocaleDateString(),
        personality: avatar.personality || 'No personality defined',
        backgroundKnowledge: avatar.backgroundKnowledge || 'No background knowledge defined',
        hasEncodedData: avatar.hasEncodedData || false,
        fileName: avatar.fileName
      }));

      setAvatars(mappedAvatars);
    } catch (err) {
      console.error('Error fetching avatars:', err);
      setError('Failed to load avatars. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load avatars on component mount
  useEffect(() => {
    fetchAvatars();
  }, []);

  // Load active avatar from localStorage
  useEffect(() => {
    const savedActiveAvatar = localStorage.getItem('activeAvatarId');
    if (savedActiveAvatar) {
      setActiveAvatarId(savedActiveAvatar);
    }
  }, []);

  const handleCreateNewAvatar = () => {
    // Navigate to create avatar page
    window.location.href = '/avatar/create';
  };

  const handleEditAvatar = (e: React.MouseEvent, avatarId: string) => {
    e.stopPropagation();
    // Navigate to edit avatar page with ID - you can adjust this route as needed
    window.location.href = `/avatar/edit?id=${avatarId}`;
  };

  const handleUseAvatarClick = (avatarId: string) => {
    setAvatarToConfirmUseId(avatarId);
    setShowUseConfirmModal(true);
  };

  const confirmUseAvatar = () => {
    if (avatarToConfirmUseId) {
      setActiveAvatarId(avatarToConfirmUseId);
      setSelectedAvatar(null);

      // Save to localStorage for persistence
      localStorage.setItem('activeAvatarId', avatarToConfirmUseId);

      // You might want to also save this to a user preferences API
      // saveUserPreference('activeAvatarId', avatarToConfirmUseId);
    }
    setShowUseConfirmModal(false);
    setAvatarToConfirmUseId(null);
  };

  const cancelUseAvatar = () => {
    setShowUseConfirmModal(false);
    setAvatarToConfirmUseId(null);
    setSelectedAvatar(null);
  };

  const handleDeleteAvatar = (e: React.MouseEvent, avatarId: string) => {
    e.stopPropagation();
    setAvatarToDeleteId(avatarId);
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!avatarToDeleteId) return;

    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(`/api/avatars/${avatarToDeleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete avatar');
      }

      // Remove from local state
      setAvatars(prev => prev.filter(avatar => avatar.id !== avatarToDeleteId));

      // Clear selections if deleted avatar was selected
      if (selectedAvatar === avatarToDeleteId) setSelectedAvatar(null);
      if (activeAvatarId === avatarToDeleteId) {
        setActiveAvatarId(null);
        localStorage.removeItem('activeAvatarId');
      }

    } catch (err) {
      console.error('Error deleting avatar:', err);
      setError('Failed to delete avatar. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmModal(false);
      setAvatarToDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setAvatarToDeleteId(null);
  };

  const handleRefresh = () => {
    fetchAvatars();
  };


  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <HiExclamationCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
            <HiUser className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Avatar
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Select from your existing avatars or create a new one to begin your journey
          </p>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <HiExclamationCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Create New Avatar Card */}
          <div
            onClick={handleCreateNewAvatar}
            className="group cursor-pointer bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 group-hover:bg-purple-200 transition-colors">
                <HiPlus className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Create New Avatar
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <HiCamera className="w-3 h-3 mr-2" />
                  Upload image
                </div>
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <HiHeart className="w-3 h-3 mr-2" />
                  Define personality
                </div>
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <HiMicrophone className="w-3 h-3 mr-2" />
                  Choose voice model
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-pulse">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Existing Avatars */}
          {!loading && avatars.map((avatar) => (
            <div
              key={avatar.id}
              className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 group relative ${activeAvatarId === avatar.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-100 hover:border-blue-200'
                }`}
            >
              <div className="text-center relative">
                {/* Action buttons */}
                <div className="absolute -top-2 -right-2 flex space-x-1">
                  <button
                    onClick={(e) => handleEditAvatar(e, avatar.id)}
                    className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
                    title="Edit Avatar"
                  >
                    <HiPencil className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteAvatar(e, avatar.id)}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
                    title="Delete Avatar"
                  >
                    <HiTrash className="w-4 h-4 text-white" />
                  </button>
                </div>

                <img
                  src={avatar.imageUrl}
                  alt={avatar.name}
                  className="w-16 h-16 rounded-full mx-auto object-cover mb-4 group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    // Fallback image if avatar image fails to load
                    (e.target as HTMLImageElement).src = '/placeholder-avatar.png';
                  }}
                />

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {avatar.name}
                </h3>

                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center justify-center">
                    <HiMicrophone className="w-3 h-3 mr-1" />
                    {avatar.voiceModel}
                  </div>
                  {avatar.hasEncodedData && (
                    <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      Encoded
                    </div>
                  )}
                  <div className="text-center pt-2 border-t border-gray-100">
                    Created {avatar.createdAt}
                  </div>
                </div>

                {/* Use This Avatar Button */}
                {activeAvatarId !== avatar.id && (
                  <button
                    onClick={() => handleUseAvatarClick(avatar.id)}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    Use This Avatar
                  </button>
                )}

                {/* Currently Selected Badge */}
                {activeAvatarId === avatar.id && (
                  <div className="mt-3 inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                    <HiCheck className="w-3 h-3 mr-1" />
                    Currently Selected
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {!loading && avatars.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <HiUser className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No avatars found</h3>
              <p className="text-gray-600 mb-6">Create your first avatar to get started</p>
              <button
                onClick={handleCreateNewAvatar}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Your First Avatar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Use Avatar Confirmation Modal */}
      {showUseConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200 transform transition-all duration-300 scale-100">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <HiUser className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Use {avatars.find(a => a.id === avatarToConfirmUseId)?.name}?
              </h3>
              <p className="text-gray-600 mb-8">
                This will set {avatars.find(a => a.id === avatarToConfirmUseId)?.name} as your active avatar for conversations.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={cancelUseAvatar}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUseAvatar}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <HiTrash className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Delete {avatars.find(a => a.id === avatarToDeleteId)?.name}?
              </h3>
              <p className="text-gray-600 mb-8">
                This action cannot be undone. The avatar and its associated files will be permanently removed from the database.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
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
      )}
    </div>
  );
}
export default Avatars;