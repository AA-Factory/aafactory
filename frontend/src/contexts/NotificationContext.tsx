'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { LOCAL_STORAGE_KEY } from '@/lib/task/constants';
import { createGalleryUrl } from '@/lib/galleryUrl';
type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'system';

interface NotificationState {
  isVisible: boolean;
  message: string;
  type: NotificationType;
  isFading: boolean;
}

export interface NotificationHistoryItem {
  id: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  timestamp: Date;
}

interface NotificationContextType {
  notification: NotificationState;
  notificationHistory: NotificationHistoryItem[];
  showNotification: (
    message: string,
    type?: NotificationType,
    duration?: number,
    options?: {
      avatarId?: string;
      taskId?: string;
      mediaType?: 'image' | 'video' | 'audio';
    },
  ) => void;
  hideNotification: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearHistory: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<NotificationState>({
    isVisible: false,
    message: '',
    type: 'info',
    isFading: false,
  });

  const [notificationHistory, setNotificationHistory] = useState<
    NotificationHistoryItem[]
  >([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
  };

  const showNotification = (
    message: string,
    type: NotificationType = 'info',
    duration = 3000,
    options?: {
      avatarId?: string;
      taskId?: string;
      mediaType?: 'image' | 'video' | 'audio';
    },
  ) => {
    clearTimers();
    setNotification({ isVisible: true, message, type, isFading: false });

    // System notifications don't get added to history or localStorage
    if (type === 'system') {
      // Auto-close after duration
      timerRef.current = setTimeout(() => {
        setNotification((prev) => ({ ...prev, isFading: true }));
        fadeTimerRef.current = setTimeout(() => {
          setNotification((prev) => ({
            ...prev,
            isVisible: false,
            message: '',
          }));
        }, 500);
      }, duration);
      return;
    }

    // Create gallery link if task info is provided
    let link: string | undefined;
    if (options?.avatarId && options?.taskId && options?.mediaType) {
      link = createGalleryUrl({
        avatarId: options.avatarId,
        mediaType: options.mediaType,
        taskId: options.taskId,
      });
    }

    // Add to history (non-system notifications only)
    const newHistoryItem: NotificationHistoryItem = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      read: false,
      link,
      timestamp: new Date(),
    };
    setNotificationHistory((prev) => {
      const updated = [newHistoryItem, ...prev];
      if (isHydrated) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    // Auto-close after duration, even across navigation
    timerRef.current = setTimeout(() => {
      setNotification((prev) => ({ ...prev, isFading: true }));
      fadeTimerRef.current = setTimeout(() => {
        setNotification((prev) => ({ ...prev, isVisible: false, message: '' }));
      }, 500);
    }, duration);
  };

  const hideNotification = () => {
    clearTimers();
    setNotification((prev) => ({ ...prev, isFading: true }));
    fadeTimerRef.current = setTimeout(() => {
      setNotification((prev) => ({ ...prev, isVisible: false, message: '' }));
    }, 500);
  };

  const markAsRead = (id: string) => {
    setNotificationHistory((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      );
      if (isHydrated) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotificationHistory((prev) => {
      const updated = prev.map((item) => ({ ...item, read: true }));
      if (isHydrated) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setNotificationHistory([]);
    if (isHydrated) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
    }
  };

  const unreadCount = notificationHistory.filter((item) => !item.read).length;

  // Load from localStorage after hydration
  useEffect(() => {
    setIsHydrated(true);
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const withDates = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setNotificationHistory(withDates);
      }
    } catch (error) {
      console.error('Failed to load notification history:', error);
    }
  }, []);

  // Do NOT reset state on route change, just let timer run
  useEffect(() => {
    return () => clearTimers();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notification,
        notificationHistory,
        showNotification,
        hideNotification,
        markAsRead,
        markAllAsRead,
        clearHistory,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      'useNotification must be used within a NotificationProvider',
    );
  return ctx;
};
