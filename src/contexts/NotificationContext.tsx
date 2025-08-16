'use client';

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationState {
  isVisible: boolean;
  message: string;
  type: NotificationType;
  isFading: boolean;
}

interface NotificationContextType {
  notification: NotificationState;
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<NotificationState>({
    isVisible: false,
    message: '',
    type: 'info',
    isFading: false,
  });

  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
  };

  const showNotification = (message: string, type: NotificationType = 'info', duration = 3000) => {
    clearTimers();
    setNotification({ isVisible: true, message, type, isFading: false });

    // Auto-close after duration, even across navigation
    timerRef.current = setTimeout(() => {
      setNotification(prev => ({ ...prev, isFading: true }));
      fadeTimerRef.current = setTimeout(() => {
        setNotification(prev => ({ ...prev, isVisible: false, message: '' }));
      }, 500);
    }, duration);
  };

  const hideNotification = () => {
    clearTimers();
    setNotification(prev => ({ ...prev, isFading: true }));
    fadeTimerRef.current = setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false, message: '' }));
    }, 500);
  };

  // Do NOT reset state on route change, just let timer run
  useEffect(() => {
    return () => clearTimers();
  }, []);

  return (
    <NotificationContext.Provider value={{ notification, showNotification, hideNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within a NotificationProvider');
  return ctx;
};
