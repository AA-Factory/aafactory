'use client';

import React, { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

type ServerType = 'infinite_talk' | 'qwen_image' | 'zonos';

const SettingsPage: React.FC = () => {
  const [servers, setServers] = useState({
    infinite_talk: false,
    qwen_image: false,
    zonos: false,
  });
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [redisEndpoint, setRedisEndpoint] = useState('redis:6379');
  const [isLoadingEnv, setIsLoadingEnv] = useState(true);
  const [isSavingEnv, setIsSavingEnv] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    const infiniteTalk = localStorage.getItem('mock_infinite_talk') === 'true';
    const qwenImage = localStorage.getItem('mock_qwen_image') === 'true';
    const zonos = localStorage.getItem('mock_zonos') === 'true';

    setServers({
      infinite_talk: infiniteTalk,
      qwen_image: qwenImage,
      zonos: zonos,
    });

    // Load environment variables
    loadEnvVars();
  }, []);

  const loadEnvVars = async () => {
    try {
      const response = await fetch('/api/env');
      if (response.ok) {
        const data = await response.json();
        setEnvVars(data.envVars);

        // Extract redis endpoint from CELERY_BROKER_URL
        const brokerUrl = data.envVars.CELERY_BROKER_URL || '';
        const match = brokerUrl.match(/redis:\/\/([^\/]+)/);
        if (match) {
          setRedisEndpoint(match[1]);
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
  };

  const handleServerChange =
    (server: ServerType) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      setServers((prev) => ({ ...prev, [server]: isChecked }));
      localStorage.setItem(`mock_${server}`, isChecked.toString());
    };

  const handleRedisEndpointChange = (endpoint: string) => {
    setRedisEndpoint(endpoint);
    // Update both CELERY_BROKER_URL and CELERY_RESULT_BACKEND
    const redisUrl = `redis://${endpoint}/0`;
    setEnvVars((prev) => ({
      ...prev,
      CELERY_BROKER_URL: redisUrl,
      CELERY_RESULT_BACKEND: redisUrl,
    }));
  };

  const handleEnvVarChange = (key: string, value: string) => {
    setEnvVars((prev) => ({ ...prev, [key]: value }));
  };

  const rebuildService = async (serviceName: string) => {
    const response = await fetch('/api/containers/manage', {
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

  const handleSaveEnvVars = async () => {
    setIsSavingEnv(true);
    try {
      // Save environment variables
      const response = await fetch('/api/env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ envVars }),
      });

      if (!response.ok) {
        throw new Error('Failed to save environment variables');
      }

      showNotification(
        'Environment variables saved. Restarting backend services...',
        'success',
      );

      // Rebuild backend services
      const services = ['backend-app', 'celery-worker', 'flower'];
      const results = await Promise.all(
        services.map((service) => rebuildService(service)),
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
            <div className="space-y-4">
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
                  value={redisEndpoint}
                  onChange={(e) => handleRedisEndpointChange(e.target.value)}
                  placeholder="redis:6379"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Format: host:port (e.g., redis:6379 or 123.45.67.89:6379)
                </p>
                {redisEndpoint !== 'redis:6379' &&
                  (servers.infinite_talk ||
                    servers.qwen_image ||
                    servers.zonos) && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>⚠️ Warning:</strong> Servers set to mock won't
                        make requests to this remote endpoint. They will return
                        mock responses instead.
                      </p>
                    </div>
                  )}
              </div>

              <button
                onClick={handleSaveEnvVars}
                disabled={isSavingEnv}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingEnv ? 'Saving...' : 'Save Redis Configuration'}
              </button>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Saving will update CELERY_BROKER_URL
                  and CELERY_RESULT_BACKEND, then automatically restart
                  backend-app, celery-worker, and flower containers.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mock Servers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Mock Servers
          </h2>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={servers.infinite_talk}
                onChange={handleServerChange('infinite_talk')}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                infinite_talk
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={servers.qwen_image}
                onChange={handleServerChange('qwen_image')}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                qwen_image
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={servers.zonos}
                onChange={handleServerChange('zonos')}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                zonos
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
