import React from 'react';
interface GenerationType {
  id: string;
  label: string;
}
interface GenerationTypeSelectorProps {
  state: { type: GenerationType | null };
  setType: (type: GenerationType) => void;
  types: GenerationType[];
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const GenerationTypeSelector: React.FC<GenerationTypeSelectorProps> = ({
  state,
  setType,
  types,
  title = 'Select generation type',
  icon: Icon = () => <div></div>,
}) => {
  // Get the current selected type - works for videoType, imageType, etc.

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold mb-4 dark:text-white">{title}</h2>
      <div className="grid grid-cols-1 gap-3 overflow-scroll">
        {types.map((type) => {
          return (
            <button
              key={type.id}
              onClick={() => setType(type)}
              className={`p-4 rounded-lg border-2 flex justify-center flex-col items-center space-y-2 transition-all w-full dark:text-white min-h-[130px] ${
                state.type?.id === type.id
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
              }`}
            >
              {/* Render the icon if provided */}
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
                {/* {state.type?.id !== type.id && (
                  <span className="block text-xs font-normal mt-1">
                    Coming Soon
                  </span>
                )} */}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
