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

  const handleEnvVarChange = (key: string, value: string) => {
    setEnvVars((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveEnvVars = async () => {
    setIsSavingEnv(true);
    try {
      const response = await fetch('/api/env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ envVars }),
      });

      if (response.ok) {
        showNotification(
          'Environment variables saved successfully. Restart containers to apply changes.',
          'success'
        );
      } else {
        throw new Error('Failed to save environment variables');
      }
    } catch (error) {
      console.error('Failed to save env vars:', error);
      showNotification('Failed to save environment variables', 'error');
    } finally {
      setIsSavingEnv(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/95 dark:to-indigo-900/20">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold dark:text-gray-100">Settings</h1>

        {/* Environment Variables */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Environment Variables
          </h2>
          {isLoadingEnv ? (
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(envVars).map(([key, value]) => (
                <div key={key}>
                  <label
                    htmlFor={`env-${key}`}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {key}
                  </label>
                  <input
                    id={`env-${key}`}
                    type="text"
                    value={value}
                    onChange={(e) => handleEnvVarChange(key, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              ))}

              <button
                onClick={handleSaveEnvVars}
                disabled={isSavingEnv}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingEnv ? 'Saving...' : 'Save Environment Variables'}
              </button>

              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> After saving, you need to restart the
                  containers for changes to take effect.
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
