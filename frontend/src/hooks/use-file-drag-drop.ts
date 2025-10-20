// frontend/src/hooks/use-file-drag-drop.ts
import { useState, useCallback, DragEvent } from 'react';

interface UseFileDragDropReturn {
  isDragging: boolean;
  handleDragOver: (e: DragEvent) => void;
  handleDragLeave: (e: DragEvent) => void;
  handleDrop: (e: DragEvent) => void;
}

export const useFileDragDrop = (
  onFileSelect: (file: File) => void,
  acceptedTypes?: string[]
): UseFileDragDropReturn => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    setIsDragging(false);

    if (dragCounter - 1 === 0) {
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (file) {
      if (acceptedTypes && acceptedTypes.length > 0) {
        const fileType = file.type;
        const isAccepted = acceptedTypes.some(type =>
          fileType.startsWith(type.split('*')[0])
        );

        if (!isAccepted) {
          console.error(`File type ${fileType} not accepted`);
          return;
        }
      }
      onFileSelect(file);
    }
  }, [onFileSelect, acceptedTypes]);

  return {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};