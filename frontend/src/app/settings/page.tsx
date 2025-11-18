'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNotification } from '@/contexts/NotificationContext';
import {
  redisSettingsSchema,
  RedisSettingsFormData,
  runpodSettingsSchema,
  RunpodSettingsFormData,
} from './schemas';
import { isMockMode } from './utils';
import {
  BACKEND_SERVICES,
  DEFAULT_REDIS_ENDPOINT,
} from '@/lib/celery/constants';
import {
  useRunpodTemplates,
  useRunpodPods,
  useDeployPod,
  useDeletePod,
} from '@/hooks/use-runpod';
import { RedisConfiguration } from '@/components/settings/RedisConfiguration';
import { RunpodConfiguration } from '@/components/settings/RunpodConfiguration';
const SettingsPage: React.FC = () => {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [isLoadingEnv, setIsLoadingEnv] = useState(true);
  const [isSavingEnv, setIsSavingEnv] = useState(false);
  const [deployedRedisEndpoint, setDeployedRedisEndpoint] = useState<
    string | null
  >(null);
  const [includeEnvVars, setIncludeEnvVars] = useState<Map<string, boolean>>(
    new Map(),
  );
  const [deployingTemplateId, setDeployingTemplateId] = useState<string | null>(
    null,
  );
  const { showNotification } = useNotification();

  const redisForm = useForm<RedisSettingsFormData>({
    resolver: zodResolver(redisSettingsSchema),
    mode: 'onChange',
    defaultValues: {
      redisEndpoint: DEFAULT_REDIS_ENDPOINT,
    },
  });

  const runpodForm = useForm<RunpodSettingsFormData>({
    resolver: zodResolver(runpodSettingsSchema),
    mode: 'onChange',
  });

  const redisEndpoint = redisForm.watch('redisEndpoint');
  const runpodApiKey = runpodForm.watch('runpodApiKey');

  // RunPod hooks
  const {
    data: templates = [],
    isFetching: isLoadingTemplates,
    refetch: refetchTemplates,
  } = useRunpodTemplates(!!runpodApiKey);

  const {
    data: pods = [],
    isFetching: isLoadingPods,
    refetch: refetchPods,
  } = useRunpodPods(!!runpodApiKey);

  const { mutate: deployPod } = useDeployPod();
  const { mutate: deletePod } = useDeletePod();

  // const copyToClipboard = (text: string) => {
  //   navigator.clipboard.writeText(text);
  //   showNotification('Copied to clipboard', 'system');
  // };

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
          redisForm.setValue('redisEndpoint', match[1]);
        }

        // Extract RunPod API key
        if (data.envVars.RUNPOD_API_KEY) {
          runpodForm.setValue('runpodApiKey', data.envVars.RUNPOD_API_KEY);
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
  }, [showNotification, redisForm, runpodForm]);

  const deployTemplate = (
    templateId: string,
    templateName: string,
    env: Record<string, string>,
  ) => {
    // get gpuTypeIds and  minVCPUPerGPU from env if present and pass to deployPod
    const gpuTypeIds = env['gpuTypeIds'] as unknown as string[];
    //ensure minVCPUPerGPU is a number
    const minVCPUPerGPU = Number(env['minVCPUPerGPU']) || undefined;

    if (!runpodApiKey) {
      showNotification('Please set RunPod API key first', 'error');
      return;
    }

    const shouldIncludeEnv = includeEnvVars.get(templateId) || false;
    setDeployingTemplateId(templateId);

    deployPod(
      {
        templateId,
        gpuTypeIds,
        minVCPUPerGPU,
        podName: `${templateName}-${Date.now()}`,
        redisEndpoint:
          shouldIncludeEnv && deployedRedisEndpoint
            ? deployedRedisEndpoint
            : undefined,
      },
      {
        onSuccess: (data) => {
          setDeployingTemplateId(null);
          showNotification(
            `Pod ${data.id} deployed successfully${data.redisEndpoint ? `. Redis endpoint: ${data.redisEndpoint}` : ''}`,
            'success',
          );

          // If this deployment returned a Redis endpoint, save it for future deployments
          if (data.redisEndpoint) {
            setDeployedRedisEndpoint(data.redisEndpoint);
          }
        },
        onError: (error) => {
          setDeployingTemplateId(null);
          showNotification(`Failed to deploy pod: ${error.message}`, 'error');
        },
      },
    );
  };

  const handleToggleEnvVars = (templateId: string, checked: boolean) => {
    const newMap = new Map(includeEnvVars);
    newMap.set(templateId, checked);
    setIncludeEnvVars(newMap);
  };

  const handleDeletePod = (podId: string) => {
    if (!runpodApiKey) {
      showNotification('Please set RunPod API key first', 'error');
      return;
    }

    if (!confirm('Are you sure you want to delete this pod?')) {
      return;
    }

    deletePod(podId, {
      onSuccess: () => {
        showNotification('Pod deleted successfully', 'success');
      },
      onError: (error) => {
        showNotification(`Failed to delete pod: ${error.message}`, 'error');
      },
    });
  };

  useEffect(() => {
    loadEnvVars();
  }, []);

  // Update mock_servers in localStorage when endpoint changes
  useEffect(() => {
    const useMockServers = isMockMode(redisEndpoint);
    localStorage.setItem('mock_servers', useMockServers.toString());
  }, [redisEndpoint]);

  // Update deployedRedisEndpoint when Redis endpoint changes (if not local)
  useEffect(() => {
    if (redisEndpoint && redisEndpoint !== 'redis:6379') {
      setDeployedRedisEndpoint(redisEndpoint);
    } else {
      setDeployedRedisEndpoint(null);
    }
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

  const onSubmitRedis = async (data: RedisSettingsFormData) => {
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

  const onSubmitRunpod = async (data: RunpodSettingsFormData) => {
    setIsSavingEnv(true);
    try {
      const updatedEnvVars = {
        ...envVars,
        ...(data.runpodApiKey && { RUNPOD_API_KEY: data.runpodApiKey }),
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
        'RunPod API key saved. Please redeploy frontend-app service to apply changes.',
        'system',
      );
    } catch (error) {
      console.error('Failed to save RunPod API key:', error);
      showNotification('Failed to save RunPod API key', 'error');
    } finally {
      setIsSavingEnv(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/95 dark:to-indigo-900/20">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold dark:text-gray-100 mb-6">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RedisConfiguration
            form={redisForm}
            isLoadingEnv={isLoadingEnv}
            isSavingEnv={isSavingEnv}
            onSubmit={onSubmitRedis}
          />

          <RunpodConfiguration
            form={runpodForm}
            isLoadingEnv={isLoadingEnv}
            isSavingEnv={isSavingEnv}
            runpodApiKey={runpodApiKey}
            templates={templates}
            isLoadingTemplates={isLoadingTemplates}
            pods={pods}
            isLoadingPods={isLoadingPods}
            deployingTemplateId={deployingTemplateId}
            deployedRedisEndpoint={deployedRedisEndpoint}
            includeEnvVars={includeEnvVars}
            onSubmitApiKey={onSubmitRunpod}
            onRefreshTemplates={() => refetchTemplates()}
            onRefreshPods={() => refetchPods()}
            onDeploy={deployTemplate}
            onDeletePod={handleDeletePod}
            onToggleEnvVars={handleToggleEnvVars}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
