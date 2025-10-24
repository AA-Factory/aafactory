import React from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

interface GenerationType {
  id: string;
  label: string;
  disabled?: boolean;
}
interface GenerationTypeSelectorProps {
  state: { type: GenerationType | null };
  setType: (type: GenerationType) => void;
  types: GenerationType[];
  title?: string;
  tooltip?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const GenerationTypeSelector: React.FC<GenerationTypeSelectorProps> = ({
  state,
  setType,
  types,
  title = 'Select generation type',
  tooltip = '',
  icon: Icon = () => <div></div>,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <h2 className="text-lg font-bold mb-1 dark:text-white">{title}</h2>
        <Tooltip text={tooltip} />
      </div>
      <div className="grid grid-cols-1 gap-3 overflow-scroll">
        {types.map((type) => {
          return (
            <button
              key={type.id}
              onClick={() => setType(type)}
              className={`p-4 rounded-lg border-2 flex justify-center flex-col items-center space-y-2 transition-all w-full dark:text-white min-h-[130px] ${
                state.type?.id === type.id
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                  : `border-gray-200 dark:border-gray-700 ${type.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'}`
              }`}
              disabled={type.disabled}
            >
              <Icon
                className={`w-6 h-6 ${
                  state.type?.id === type.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              />
              <span
                className={`font-semibold ${
                  state.type?.id === type.id
                    ? ''
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {type.label}
                {type.disabled && (
                  <span className="block text-xs font-normal mt-1">
                    Coming Soon
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
