import React from 'react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  hidden?: boolean;
}

export interface SelectProps<T extends string = string> {
  name?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function Select<T extends string = string>({
  name,
  value,
  options,
  onChange,
  className = '',
  disabled = false,
  placeholder,
}: SelectProps<T>) {
  const baseClasses =
    'w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 text-sm transition-colors';

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  return (
    <select
      name={name}
      value={value}
      className={`${baseClasses} ${disabledClasses} ${className}`.trim()}
      onChange={(e) => onChange(e.target.value as T)}
      disabled={disabled}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options
        .filter((option) => !option.hidden)
        .map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
    </select>
  );
}

// Usage example:
/*
type AudioSource = 'avatar' | 'rick_and_morty' | 'japanese';

const audioOptions: SelectOption<AudioSource>[] = [
  {
    value: 'avatar',
    label: "Avatar's uploaded audio",
    hidden: !avatar?.trainingAudioPath,
  },
  {
    value: 'rick_and_morty',
    label: 'Rick and Morty (default)',
  },
  {
    value: 'japanese',
    label: 'Japanese Voice',
  },
];

<Select<AudioSource>
  name="audioSource"
  value={selectedAudioSource}
  options={audioOptions}
  onChange={onAudioSourceChange}
/>
*/
