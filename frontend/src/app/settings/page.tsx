'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNotification } from '@/contexts/NotificationContext';
import { PiCopySimpleLight } from 'react-icons/pi';
import { redisSettingsSchema, RedisSettingsFormData } from './schemas';
import { parseRedisEndpoint, isMockMode, formatRedisEnvVars } from './utils';
import {
  BACKEND_SERVICES,
  DEFAULT_REDIS_ENDPOINT,
} from '@/lib/celery/constants';

const SettingsPage: React.FC = () => {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [isLoadingEnv, setIsLoadingEnv] = useState(true);
  const [isSavingEnv, setIsSavingEnv] = useState(false);
  const { showNotification } = useNotification();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<RedisSettingsFormData>({
    resolver: zodResolver(redisSettingsSchema),
    mode: 'onChange',
    defaultValues: {
      redisEndpoint: DEFAULT_REDIS_ENDPOINT,
    },
  });

  const redisEndpoint = watch('redisEndpoint');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard', 'system');
  };

  const loadEnvVars = useCallback(async () => {
    try {
      const response = await fetch('/api/env');
      if (response.ok) {
        const data = await response.json();
        setEnvVars(data.envVars);

        // Extract redis endpoint from CELERY_BROKER_URL
        const brokerUrl = data.envVars.CELERY_BROKER_URL || '';
        const match = brokerUrl.match(/redis:\/\/([^\/]+)/);
        if (match) {
          setValue('redisEndpoint', match[1]);
        }
      } else {
        showNotification('Failed to load environment variables', 'error');
      }
    } catch (error) {
      console.error('Failed to load env vars:', error);
      showNotification('Failed to load environment variables', 'error');
    } finally {
      setIsLoadingEnv(false);
    }
  }, [showNotification, setValue]);

  useEffect(() => {
    loadEnvVars();
  }, []);

  // Update mock_servers in localStorage when endpoint changes
  useEffect(() => {
    const useMockServers = isMockMode(redisEndpoint);
    localStorage.setItem('mock_servers', useMockServers.toString());
  }, [redisEndpoint]);

  const rebuildService = async (serviceName: string) => {
    const response = await fetch('/api/containers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'rebuild-compose',
        serviceName,
      }),
    });
    return response.ok;
  };

  const onSubmit = async (data: RedisSettingsFormData) => {
    setIsSavingEnv(true);
    try {
      // Update envVars with new Redis configuration
      const redisUrl = `redis://${data.redisEndpoint}/0`;
      const updatedEnvVars = {
        ...envVars,
        CELERY_BROKER_URL: redisUrl,
        CELERY_RESULT_BACKEND: redisUrl,
      };

      // Save environment variables
      const response = await fetch('/api/env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ envVars: updatedEnvVars }),
      });

      if (!response.ok) {
        throw new Error('Failed to save environment variables');
      }

      setEnvVars(updatedEnvVars);

      showNotification(
        'Environment variables saved. Restarting backend services...',
        'system',
      );

      // Rebuild backend services
      const results = await Promise.all(
        BACKEND_SERVICES.map((service) => rebuildService(service)),
      );

      const allSucceeded = results.every((r) => r);
      if (allSucceeded) {
        showNotification(
          'Redis configuration updated and backend services restarted successfully',
          'success',
        );
      } else {
        showNotification(
          'Redis configuration saved but some services failed to restart. Check container logs.',
          'error',
        );
      }
    } catch (error) {
      console.error('Failed to save env vars:', error);
      showNotification('Failed to update Redis configuration', 'error');
    } finally {
      setIsSavingEnv(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/95 dark:to-indigo-900/20">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold dark:text-gray-100">Settings</h1>

        {/* Redis Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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
                      <strong>✓ Mock Mode:</strong> Using local Redis. All
                      servers will return mock responses.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>ℹ Remote Server Set:</strong> Using remote Redis.
                      All servers will make real API calls.
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
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = parseRedisEndpoint(redisEndpoint);
                          if (parsed) {
                            copyToClipboard(formatRedisEnvVars(parsed));
                          }
                        }}
                        className="ml-3 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Copy to clipboard"
                      >
                        <PiCopySimpleLight
                          size={20}
                          className="text-gray-600 dark:text-gray-300"
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSavingEnv || !isValid}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingEnv ? 'Saving...' : 'Save Redis Configuration'}
              </button>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Saving will update CELERY_BROKER_URL
                  and CELERY_RESULT_BACKEND, then automatically restart
                  backend-app, celery-worker, and flower containers.
                  {isMockMode(redisEndpoint)
                    ? ' Mock servers will be enabled.'
                    : ' Mock servers will be disabled.'}
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
