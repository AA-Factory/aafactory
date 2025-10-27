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
  const [redisEndpoint, setRedisEndpoint] = useState('');
  const [isSaving, setIsSaving] = useState(false);
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

    // Load current Redis endpoint from localStorage
    const savedEndpoint = localStorage.getItem('redis_endpoint');
    setRedisEndpoint(savedEndpoint || 'redis:6379');
  }, []);

  const handleServerChange =
    (server: ServerType) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      setServers((prev) => ({ ...prev, [server]: isChecked }));
      localStorage.setItem(`mock_${server}`, isChecked.toString());
    };

  const pollContainerHealth = async (
    baseUrl: string,
    maxAttempts = 30,
  ): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${baseUrl}/health`, {
          method: 'GET',
        });
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Container not ready yet, continue polling
      }
      // Wait 2 seconds before next attempt
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    return false;
  };

  const pollFlowerHealth = async (maxAttempts = 30): Promise<boolean> => {
    const flowerUrl =
      window.location.hostname === 'localhost'
        ? 'http://localhost:5556'
        : 'http://aafactory-demo.xyz:5556';

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${flowerUrl}/api/workers`, {
          method: 'GET',
        });
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Flower not ready yet, continue polling
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    return false;
  };

  const pollAllServices = async (): Promise<{
    backend: boolean;
    flower: boolean;
  }> => {
    const [backend, flower] = await Promise.all([
      pollContainerHealth(process.env.NEXT_PUBLIC_CELERY_BASE_URL || ''),
      // pollFlowerHealth(),
    ]);

    return { backend, flower };
  };

  const handleSaveRedisEndpoint = async () => {
    setIsSaving(true);
    try {
      const endpoint = redisEndpoint.trim() || 'redis:6379';

      // Validate endpoint format (host:port)
      const parts = endpoint.split(':');
      if (parts.length !== 2) {
        showNotification(
          'Invalid endpoint format. Use host:port (e.g., redis:6379)',
          'error',
        );
        setIsSaving(false);
        return;
      }

      const port = parseInt(parts[1], 10);
      if (isNaN(port) || port < 0 || port > 65535) {
        showNotification(
          'Invalid port number. Port must be between 0 and 65535.',
          'system',
        );
        setIsSaving(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CELERY_BASE_URL}/update_env/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            env_vars: {
              CELERY_BROKER_URL: `redis://${endpoint}/0`,
              CELERY_RESULT_BACKEND: `redis://${endpoint}/0`,
            },
          }),
        },
      );

      if (response.ok) {
        // Save to localStorage on success
        localStorage.setItem('redis_endpoint', endpoint);

        showNotification(
          'Environment updated. Waiting for containers to restart...',
          'success',
        );

        // Poll all services health endpoints
        // const { backend, flower } = await pollAllServices();

        // if (backend && flower) {
        //   showNotification(
        //     'Redis endpoint updated and all services restarted successfully',
        //     'success',
        //   );
        // } else {
        //   const failedServices = [];
        //   if (!backend) failedServices.push('backend');
        //   if (!flower) failedServices.push('flower/celery');

        //   showNotification(
        //     `Services are taking longer than expected to restart: ${failedServices.join(', ')}. Please check manually.`,
        //     'error',
        //   );
        // }
      } else {
        throw new Error('Failed to update Redis endpoint');
      }
    } catch (error) {
      console.error('Failed to save Redis endpoint:', error);
      showNotification(
        'Failed to update Redis endpoint. Please try again.',
        'error',
      );
    } finally {
      setIsSaving(false);
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
                onChange={(e) => setRedisEndpoint(e.target.value)}
                placeholder="redis:6379"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Enter your remote Redis endpoint (e.g., 123.45.67.89:6379).
                Leave as default for local Redis.
              </p>
            </div>

            <button
              onClick={handleSaveRedisEndpoint}
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save & Restart Services'}
            </button>

            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Saving will restart the backend and
                celery worker containers. Any running tasks may be interrupted.
              </p>
            </div>
          </div>
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
