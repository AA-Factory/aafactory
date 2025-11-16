import React, { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  showCloseButton?: boolean;
  overlayClassName?: string;
  contentClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-4xl',
  maxHeight = 'max-h-[90vh]',
  showCloseButton = true,
  overlayClassName = '',
  contentClassName = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-blue-900/40 bg-opacity-50 p-8 ${overlayClassName}`}
    >
      <div
        ref={modalRef}
        className={`relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full ${maxWidth} ${maxHeight} overflow-auto ${contentClassName}`}
      >
        {/* Close Button */}
        {showCloseButton && (
          <button
            className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg z-10 transition-colors"
            onClick={onClose}
          >
            <FiX className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        {title && (
          <div className="p-8 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className={title ? 'px-8 pb-8' : 'p-8'}>{children}</div>
      </div>
    </div>
  );
};
