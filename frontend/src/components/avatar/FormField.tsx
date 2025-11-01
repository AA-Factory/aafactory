import { AvatarFormData } from '@/lib/types/avatar';
import React from 'react';
import { HiChevronDown, HiExclamationCircle } from 'react-icons/hi';
import { Label } from '@/components/ui/Label';

interface FormFieldProps {
  id: string;
  name: keyof AvatarFormData;
  label: string;
  type?: 'text' | 'textarea' | 'select';
  rows?: number;
  placeholder?: string;
  register: (name: keyof AvatarFormData) => Record<string, unknown>;
  error?: string;
  options?: ReadonlyArray<{ label: string; value: string }> | undefined;
  hidden?: boolean;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  name,
  label,
  type = 'text',
  rows,
  placeholder,
  register,
  error,
  options,
  hidden,
  required = false,
}) => {
  if (hidden) return null;
  const baseClasses =
    'w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 text-sm';
  const errorClasses = error
    ? 'border-red-300 dark:border-red-600'
    : 'border-gray-300 dark:border-gray-600';

  return (
    <div className="mb-3">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 dark:text-red-400"> *</span>}
      </Label>

      {type === 'textarea' ? (
        <textarea
          id={id}
          {...register(name)}
          rows={rows}
          placeholder={placeholder}
          className={`${baseClasses} resize-none placeholder-gray-500 dark:placeholder-gray-400 ${errorClasses}`}
        />
      ) : type === 'select' && options ? (
        <div className="relative">
          <select
            id={id}
            {...register(name)}
            className={`${baseClasses} appearance-none cursor-pointer ${errorClasses}`}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <HiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        </div>
      ) : (
        <input
          type="text"
          id={id}
          {...register(name)}
          placeholder={placeholder}
          className={`${baseClasses} placeholder-gray-500 dark:placeholder-gray-400 ${errorClasses}`}
        />
      )}

      {error && (
        <div className="mt-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
          <HiExclamationCircle className="h-3 w-3" />
          <span className="text-xs">{error}</span>
        </div>
      )}
    </div>
  );
};
