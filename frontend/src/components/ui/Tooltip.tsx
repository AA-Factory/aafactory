import React, { useRef, useState } from 'react';
import { FiInfo } from 'react-icons/fi';

interface TooltipProps {
  text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    }
  };

  return (
    <div className="relative group" ref={triggerRef} onMouseEnter={handleMouseEnter}>
      <FiInfo className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
      <div
        className="fixed -translate-y-full -translate-x-1/2 -mt-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        {text}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
      </div>
    </div>
  );
};
