import React from 'react';

export interface MediaActionButtonProps {
  onClick?: () => void;
  href?: string;
  download?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
}

export const MediaActionButton: React.FC<MediaActionButtonProps> = ({
  onClick,
  href,
  download,
  children,
  className = '',
  variant = 'primary',
  size = 'sm',
}) => {
  const baseClasses =
    'font-medium rounded-md transition-colors inline-flex items-center justify-center';

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <a href={href} download={download} className={combinedClasses}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={combinedClasses}>
      {children}
    </button>
  );
};
