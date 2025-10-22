import React from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

interface LabelProps {
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  tooltipText?: string;
}

export const Label: React.FC<LabelProps> = ({
  htmlFor,
  children,
  className = '',
  required = false,
  tooltipText,
}) => {
  const baseClasses =
    'block text-sm font-medium text-gray-700 dark:text-gray-200';
  const combinedClasses = className
    ? `${baseClasses} ${className}`
    : baseClasses;

  return (
    <label htmlFor={htmlFor} className={combinedClasses}>
      <div className="flex items-center space-x-2">
        <span>
          {children}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {tooltipText && <Tooltip text={tooltipText} />}
      </div>
    </label>
  );
};
