'use client';

import React, { useState } from 'react';
import type { RunpodTemplate } from '@/hooks/use-runpod';
import { FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { getTemplateConfig } from '@/app/settings/runpod-constants';

interface RunpodTemplatesProps {
  templates: RunpodTemplate[];
  isLoading: boolean;
  deployingTemplateId: string | null;
  deployedRedisEndpoint: string | null;
  includeEnvVars: Map<string, boolean>;
  onRefresh: () => void;
  onDeploy: (
    templateId: string,
    templateName: string,
    env: Record<string, string | number>,
  ) => void;
  onToggleEnvVars: (templateId: string, checked: boolean) => void;
}

export function RunpodTemplates({
  templates,
  isLoading,
  deployingTemplateId,
  deployedRedisEndpoint,
  includeEnvVars,
  onRefresh,
  onDeploy,
  onToggleEnvVars,
}: RunpodTemplatesProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedGpuTypes, setSelectedGpuTypes] = useState<Map<string, string>>(
    new Map(),
  );
  const [selectedVCPUs, setSelectedVCPUs] = useState<Map<string, number>>(
    new Map(),
  );

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-white">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-md font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-[100%]"
        >
          Templates
          {isCollapsed ? (
            <FiChevronDown className="w-5 h-5" />
          ) : (
            <FiChevronUp className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiRefreshCw
            className={`inline-block mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {!isCollapsed && (
        <>
          {deployedRedisEndpoint && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Redis Endpoint:</strong> {deployedRedisEndpoint}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                This endpoint will be used for all future deployments
              </p>
            </div>
          )}

          {templates.length > 0 && (
            <div className="space-y-3 overflow-scroll max-h-96">
              {templates.map((template) => {
                const config = getTemplateConfig(template.id);
                const hasConfig =
                  config.gpuTypeIds.length > 0 || config.vCPUOptions.length > 0;

                return (
                  <div
                    key={template.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {template.name}
                        </h4>
                        {template.imageName && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {template.imageName}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => {
                          const envRecord: Record<string, string | number> = {};

                          // Add selected GPU type and vCPU from dropdowns (or use defaults)
                          const selectedGpu = selectedGpuTypes.get(template.id) ||
                            config.defaultGpuTypeId ||
                            config.gpuTypeIds[0];
                          const selectedVCPU = selectedVCPUs.get(template.id) ||
                            config.defaultVCPU ||
                            config.vCPUOptions[0];

                          if (selectedGpu) {
                            envRecord.gpuTypeIds = selectedGpu;
                          }
                          if (selectedVCPU) {
                            envRecord.minVCPUPerGPU = selectedVCPU;
                          }

                          onDeploy(template.id, template.name, envRecord);
                        }}
                        disabled={deployingTemplateId === template.id}
                      >
                        {deployingTemplateId === template.id
                          ? 'Deploying...'
                          : 'Deploy'}
                      </Button>
                    </div>

                    {hasConfig && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {config.gpuTypeIds.length > 0 && (
                          <div>
                            <label
                              htmlFor={`gpu-${template.id}`}
                              className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                              GPU Type
                            </label>
                            <select
                              id={`gpu-${template.id}`}
                              value={
                                selectedGpuTypes.get(template.id) ||
                                config.defaultGpuTypeId ||
                                config.gpuTypeIds[0]
                              }
                              onChange={(e) => {
                                const newMap = new Map(selectedGpuTypes);
                                newMap.set(template.id, e.target.value);
                                setSelectedGpuTypes(newMap);
                              }}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            >
                              {config.gpuTypeIds.map((gpuType) => (
                                <option key={gpuType} value={gpuType}>
                                  {gpuType}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {config.vCPUOptions.length > 0 && (
                          <div>
                            <label
                              htmlFor={`vcpu-${template.id}`}
                              className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                              Min vCPU per GPU
                            </label>
                            <select
                              id={`vcpu-${template.id}`}
                              value={
                                selectedVCPUs.get(template.id) ||
                                config.defaultVCPU ||
                                config.vCPUOptions[0]
                              }
                              onChange={(e) => {
                                const newMap = new Map(selectedVCPUs);
                                newMap.set(template.id, Number(e.target.value));
                                setSelectedVCPUs(newMap);
                              }}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            >
                              {config.vCPUOptions.map((vcpu) => (
                                <option key={vcpu} value={vcpu}>
                                  {vcpu} vCPU
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                    {deployedRedisEndpoint && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`env-${template.id}`}
                          checked={includeEnvVars.get(template.id) || false}
                          onChange={(e) =>
                            onToggleEnvVars(template.id, e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label
                          htmlFor={`env-${template.id}`}
                          className="text-sm text-gray-600 dark:text-gray-400"
                        >
                          Use redis configuration
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && templates.length === 0 && (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              No templates found. Click "Refresh Templates" to fetch available
              templates.
            </p>
          )}
        </>
      )}
    </div>
  );
}
