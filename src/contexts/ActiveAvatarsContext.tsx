'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ActiveAvatarsContextType {
  activeAvatarIds: string[];
  addActiveAvatar: (avatarId: string) => void;
  removeActiveAvatar: (avatarId: string) => void;
  toggleActiveAvatar: (avatarId: string) => void;
  isAvatarActive: (avatarId: string) => boolean;
  clearActiveAvatars: () => void;
  setActiveAvatars: (avatarIds: string[]) => void;
}

const ActiveAvatarsContext = createContext<ActiveAvatarsContextType | undefined>(undefined);

interface ActiveAvatarsProviderProps {
  children: ReactNode;
}

export const ActiveAvatarsProvider: React.FC<ActiveAvatarsProviderProps> = ({ children }) => {
  const [activeAvatarIds, setActiveAvatarIds] = useState<string[]>([]);

  // Load active avatars from localStorage on mount
  useEffect(() => {
    const savedActiveAvatars = localStorage.getItem('activeAvatarIds');
    if (savedActiveAvatars) {
      try {
        const parsed = JSON.parse(savedActiveAvatars);
        if (Array.isArray(parsed)) {
          setActiveAvatarIds(parsed);
        }
      } catch (error) {
        console.error('Error parsing active avatars from localStorage:', error);
        // Fallback: check for old single avatar format
        const oldSavedAvatar = localStorage.getItem('activeAvatarId');
        if (oldSavedAvatar) {
          setActiveAvatarIds([oldSavedAvatar]);
          localStorage.removeItem('activeAvatarId'); // Clean up old format
        }
      }
    }
  }, []);

  // Save to localStorage whenever activeAvatarIds changes
  useEffect(() => {
    localStorage.setItem('activeAvatarIds', JSON.stringify(activeAvatarIds));
  }, [activeAvatarIds]);

  const addActiveAvatar = (avatarId: string) => {
    setActiveAvatarIds(prev => {
      if (!prev.includes(avatarId)) {
        return [...prev, avatarId];
      }
      return prev;
    });
  };

  const removeActiveAvatar = (avatarId: string) => {
    setActiveAvatarIds(prev => prev.filter(id => id !== avatarId));
  };

  const toggleActiveAvatar = (avatarId: string) => {
    setActiveAvatarIds(prev => {
      if (prev.includes(avatarId)) {
        return prev.filter(id => id !== avatarId);
      } else {
        return [...prev, avatarId];
      }
    });
  };

  const isAvatarActive = (avatarId: string) => {
    return activeAvatarIds.includes(avatarId);
  };

  const clearActiveAvatars = () => {
    setActiveAvatarIds([]);
  };

  const setActiveAvatars = (avatarIds: string[]) => {
    setActiveAvatarIds(avatarIds);
  };

  const value: ActiveAvatarsContextType = {
    activeAvatarIds,
    addActiveAvatar,
    removeActiveAvatar,
    toggleActiveAvatar,
    isAvatarActive,
    clearActiveAvatars,
    setActiveAvatars,
  };

  return (
    <ActiveAvatarsContext.Provider value={value}>
      {children}
    </ActiveAvatarsContext.Provider>
  );
};

export const useActiveAvatars = (): ActiveAvatarsContextType => {
  const context = useContext(ActiveAvatarsContext);
  if (!context) {
    throw new Error('useActiveAvatars must be used within an ActiveAvatarsProvider');
  }
  return context;
};