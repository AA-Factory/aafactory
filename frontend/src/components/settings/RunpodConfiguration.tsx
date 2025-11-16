'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { RunpodSettingsFormData } from '@/app/settings/schemas';
import { RunpodApiKey } from './RunpodApiKey';
import { RunpodTemplates } from './RunpodTemplates';
import { RunpodPods } from './RunpodPods';
import type { RunpodTemplate, RunpodPod } from '@/hooks/use-runpod';

interface RunpodConfigurationProps {
  form: UseFormReturn<RunpodSettingsFormData>;
  isLoadingEnv: boolean;
  isSavingEnv: boolean;
  runpodApiKey: string | undefined;
  templates: RunpodTemplate[];
  isLoadingTemplates: boolean;
  pods: RunpodPod[];
  isLoadingPods: boolean;
  deployingTemplateId: string | null;
  deployedRedisEndpoint: string | null;
  includeEnvVars: Map<string, boolean>;
  onSubmitApiKey: (data: RunpodSettingsFormData) => Promise<void>;
  onRefreshTemplates: () => void;
  onRefreshPods: () => void;
  onDeploy: (
    templateId: string,
    templateName: string,
    env: Record<string, string>,
  ) => void;
  onDeletePod: (podId: string) => void;
  onToggleEnvVars: (templateId: string, checked: boolean) => void;
}

export function RunpodConfiguration({
  form,
  isLoadingEnv,
  isSavingEnv,
  runpodApiKey,
  templates,
  isLoadingTemplates,
  pods,
  isLoadingPods,
  deployingTemplateId,
  deployedRedisEndpoint,
  includeEnvVars,
  onSubmitApiKey,
  onRefreshTemplates,
  onRefreshPods,
  onDeploy,
  onDeletePod,
  onToggleEnvVars,
}: RunpodConfigurationProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-fit">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        RunPod Configuration
      </h2>
      {isLoadingEnv ? (
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      ) : (
        <>
          <RunpodApiKey
            form={form}
            isSavingEnv={isSavingEnv}
            onSubmit={onSubmitApiKey}
          />

          {runpodApiKey && (
            <>
              <RunpodTemplates
                templates={templates}
                isLoading={isLoadingTemplates}
                deployingTemplateId={deployingTemplateId}
                deployedRedisEndpoint={deployedRedisEndpoint}
                includeEnvVars={includeEnvVars}
                onRefresh={onRefreshTemplates}
                onDeploy={onDeploy}
                onToggleEnvVars={onToggleEnvVars}
              />

              <RunpodPods
                pods={pods}
                isLoading={isLoadingPods}
                onRefresh={onRefreshPods}
                onDeletePod={onDeletePod}
                deployedRedisEndpoint={deployedRedisEndpoint}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
