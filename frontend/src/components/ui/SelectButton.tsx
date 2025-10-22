import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface SelectButtonProps {
  /** Whether this button is currently selected */
  selected: boolean;
  /** Click handler for the button */
  onClick: () => void;
  /** Icon component to display (Lucide icon or any icon component) */
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  /** Main label text */
  label: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Optional additional CSS classes */
  className?: string;
  /** Optional subtitle text (e.g., "Coming Soon") */
  subtitle?: string;
}

/**
 * A selectable button component with icon, label, and optional states
 * Features dark mode support and smooth transitions
 */
export const SelectButton: React.FC<SelectButtonProps> = ({
  selected,
  onClick,
  icon: Icon,
  label,
  disabled = false,
  className = '',
  subtitle,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-4 rounded-lg border-2 flex justify-center flex-col items-center space-y-2 
        transition-all w-full dark:text-white min-h-[130px]
        ${
          selected
            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
            : `border-gray-200 dark:border-gray-700 ${
                disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-blue-400'
              }`
        }
        ${className}
      `}
    >
      <Icon
        className={`w-6 h-6 ${
          selected
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-400 dark:text-gray-500'
        }`}
      />
      <span
        className={`font-semibold ${
          selected ? '' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {label}
        {subtitle && (
          <span className="block text-xs font-normal mt-1">{subtitle}</span>
        )}
      </span>
    </button>
  );
};
