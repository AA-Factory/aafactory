// src/components/Notification.tsx
'use client';

import React from 'react';
import { HiExclamationCircle, HiCheckCircle, HiInformationCircle, HiExclamation, HiX } from 'react-icons/hi';
import { useNotification } from '@/contexts/NotificationContext';

const Notification = () => {
  const { notification, hideNotification } = useNotification();

  if (!notification.isVisible || !notification.message) {
    return null;
  }

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border border-green-200 shadow-lg',
          text: 'text-green-800',
          icon: HiCheckCircle,
          iconColor: 'text-green-600',
        };
      case 'error':
        return {
          container: 'bg-red-50 border border-red-200 shadow-lg',
          text: 'text-red-800',
          icon: HiExclamationCircle,
          iconColor: 'text-red-600',
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border border-yellow-200 shadow-lg',
          text: 'text-yellow-800',
          icon: HiExclamation,
          iconColor: 'text-yellow-600',
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 border border-blue-200 shadow-lg',
          text: 'text-blue-800',
          icon: HiInformationCircle,
          iconColor: 'text-blue-600',
        };
    }
  };

  const styles = getNotificationStyles(notification.type);
  const IconComponent = styles.icon;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 max-w-sm rounded-lg p-3 transition-all duration-500 ease-out ${styles.container} ${notification.isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
    >
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0">
          <IconComponent className={`h-4 w-4 ${styles.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium ${styles.text} line-clamp-2`}>
            {notification.message}
          </p>
        </div>
        <button
          onClick={hideNotification}
          className={`flex-shrink-0 ml-1 inline-flex rounded-md p-1 hover:bg-opacity-20 focus:outline-none focus:ring-1 focus:ring-offset-1 ${styles.iconColor} hover:bg-gray-500 transition-colors`}
        >
          <span className="sr-only">Dismiss</span>
          <HiX className={`h-3 w-3 ${styles.iconColor}`} />
        </button>
      </div>
    </div>
  );
};

export default Notification;
