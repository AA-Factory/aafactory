'use client';

import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { RunpodSettingsFormData } from '@/app/settings/schemas';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';

interface RunpodApiKeyProps {
  form: UseFormReturn<RunpodSettingsFormData>;
  isSavingEnv: boolean;
  onSubmit: (data: RunpodSettingsFormData) => Promise<void>;
}

export function RunpodApiKey({
  form,
  isSavingEnv,
  onSubmit,
}: RunpodApiKeyProps) {
  const { register, handleSubmit } = form;
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-md font-medium text-gray-900 dark:text-gray-100 hover:text-gray-900 dark:hover:text-gray-100 transition-colors w-[100%]"
        >
          RunPod API Key
          {isCollapsed ? (
            <FiChevronDown className="w-4 h-4" />
          ) : (
            <FiChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div>
            <input
              id="runpod-api-key"
              type="password"
              {...register('runpodApiKey')}
              placeholder="Enter your RunPod API key"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Get your API key from{' '}
              <a
                href="https://www.runpod.io/console/user/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                RunPod Console
              </a>
            </p>
          </div>

          <Button
            variant="primary"
            type="submit"
            disabled={isSavingEnv}
            fullWidth
            // className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingEnv ? 'Saving...' : 'Save RunPod API Key'}
          </Button>
        </>
      )}
    </form>
  );
}
