import React from 'react';

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  placeholder = '',
  maxLength,
  rows = 6,
  className = '',
  disabled = false,
  required = false,
  name,
  id,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const baseClasses =
    'w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';

  return (
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={handleChange}
      className={`${baseClasses} ${className}`}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      disabled={disabled}
      required={required}
      style={{ height: `${rows * 1.5}rem` }}
    />
  );
};
