'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { PiCopySimpleLight } from 'react-icons/pi';
import { RedisSettingsFormData } from '@/app/settings/schemas';
import {
  parseRedisEndpoint,
  isMockMode,
  formatRedisEnvVars,
} from '@/app/settings/utils';
import { BACKEND_SERVICES } from '@/lib/celery/constants';
import { CopyToClipboard } from '../ui/CopyToClipBoard';
import { Button } from '@/components/ui/Button';

interface RedisConfigurationProps {
  form: UseFormReturn<RedisSettingsFormData>;
  isLoadingEnv: boolean;
  isSavingEnv: boolean;
  onSubmit: (data: RedisSettingsFormData) => Promise<void>;
}

export function RedisConfiguration({
  form,
  isLoadingEnv,
  isSavingEnv,
  onSubmit,
}: RedisConfigurationProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = form;

  const redisEndpoint = watch('redisEndpoint');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-fit">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Redis Configuration
      </h2>
      {isLoadingEnv ? (
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="redis-endpoint"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Redis Endpoint
            </label>
            <input
              id="redis-endpoint"
              type="text"
              {...register('redisEndpoint')}
              placeholder="redis:6379"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Format: host:port (e.g., redis:6379 or 123.45.67.89:6379)
            </p>
            {errors.redisEndpoint ? (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>✗ Invalid Format:</strong>{' '}
                  {errors.redisEndpoint.message}
                </p>
              </div>
            ) : isMockMode(redisEndpoint) ? (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>✓ Mock Mode:</strong> Using local Redis. All servers
                  will return mock responses.
                </p>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>ℹ Remote Server Set:</strong> Using remote Redis. All
                  servers will make real API calls.
                </p>
              </div>
            )}
            {!errors.redisEndpoint && parseRedisEndpoint(redisEndpoint) && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Environment variables for runpod child servers:
                    </p>
                    <code className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                      REDIS_HOST={parseRedisEndpoint(redisEndpoint)?.host}
                      <br />
                      REDIS_PORT={parseRedisEndpoint(redisEndpoint)?.port}
                    </code>
                  </div>
                  <CopyToClipboard
                    text={formatRedisEnvVars(
                      parseRedisEndpoint(redisEndpoint)!,
                    )}
                    className="ml-3 text-white"
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            type="submit"
            disabled={isSavingEnv || !isValid}
            fullWidth
            // className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingEnv ? 'Saving...' : 'Save Redis Configuration'}
          </Button>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Saving will update CELERY_BROKER_URL and
              CELERY_RESULT_BACKEND, then automatically restart{' '}
              {BACKEND_SERVICES.join(', ')} containers.
              {isMockMode(redisEndpoint)
                ? ' Mock servers will be enabled.'
                : ' Mock servers will be disabled.'}
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
