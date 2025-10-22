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
import { useLocalStorage } from 'usehooks-ts';
import { LOCAL_STORAGE_KEY } from '@/lib/task/constants';
type NotificationType = 'success' | 'error' | 'warning' | 'info';

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
}

interface NotificationContextType {
  notification: NotificationState;
  notificationHistory: NotificationHistoryItem[];
  showNotification: (
    message: string,
    type?: NotificationType,
    duration?: number,
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

  const [notificationHistory, setNotificationHistory] = useLocalStorage<
    NotificationHistoryItem[]
  >(LOCAL_STORAGE_KEY, []);

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
  ) => {
    clearTimers();
    setNotification({ isVisible: true, message, type, isFading: false });

    // Add to history
    const newHistoryItem: NotificationHistoryItem = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      read: false,
    };
    setNotificationHistory((prev) => [newHistoryItem, ...prev]);

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
    setNotificationHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  };

  const markAllAsRead = () => {
    setNotificationHistory((prev) =>
      prev.map((item) => ({ ...item, read: true })),
    );
  };

  const clearHistory = () => {
    setNotificationHistory([]);
  };

  const unreadCount = notificationHistory.filter((item) => !item.read).length;

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
