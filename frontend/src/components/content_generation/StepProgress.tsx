import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';

interface Step {
  label: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  onStepChange,
}) => {
  return (
    <ol className="flex justify-between items-center w-full p-3 space-x-2 text-sm font-medium text-center text-gray-500rounded-lg shadow-xs dark:text-gray-400 sm:text-base sm:p-4 sm:space-x-4 rtl:space-x-reverse">
      {steps.map((step, idx) => (
        <li
          key={step.label}
          className={`flex items-center ${
            currentStep === idx
              ? 'text-blue-600 dark:text-blue-500'
              : currentStep > idx
                ? 'text-green-600 dark:text-green-500 cursor-pointer'
                : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => {
            if (idx <= currentStep) {
              onStepChange(idx);
            }
          }}
        >
          <span
            className={`flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0 ${
              currentStep === idx
                ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : currentStep > idx
                  ? 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/30'
                  : 'border-gray-500 dark:border-gray-400'
            }`}
          >
            {currentStep > idx ? (
              <FiCheckCircle className="w-3 h-3" />
            ) : (
              idx + 1
            )}
          </span>
          <span className="hidden w-full sm:inline-flex">{step.label}</span>
          <span className="sm:hidden">{idx + 1}</span>
          {idx < steps.length - 1 && (
            <svg
              className="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 12 10"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m7 9 4-4-4-4M1 9l4-4-4-4"
              />
            </svg>
          )}
        </li>
      ))}
    </ol>
  );
};
