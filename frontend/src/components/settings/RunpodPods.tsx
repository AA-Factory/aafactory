'use client';

import React, { useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import type { RunpodPod } from '@/hooks/use-runpod';
import { FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { CopyToClipboard } from '../ui/CopyToClipBoard';
import {
  buildRedisEndpoint,
  checkforRedisInEnvVars,
} from '@/app/settings/utils';
interface RunpodPodsProps {
  pods: RunpodPod[];
  isLoading: boolean;
  onRefresh: () => void;
  onDeletePod: (podId: string) => void;
  deployedRedisEndpoint: string | null;
}

export function RunpodPods({
  pods,
  isLoading,
  onRefresh,
  onDeletePod,
  deployedRedisEndpoint,
}: RunpodPodsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-md font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-[100%]"
        >
          Running Pods
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
          {pods.length > 0 && (
            <div className="space-y-3">
              {pods.map((pod) => {
                const hasRedisEnv = pod.env && checkforRedisInEnvVars(pod.env);
                const podEndpoint = buildRedisEndpoint(pod);
                const isParent =
                  podEndpoint === deployedRedisEndpoint && !hasRedisEnv;
                const isChild =
                  hasRedisEnv && pod.env?.REDIS_HOST && pod.env?.REDIS_PORT
                    ? `${pod.env.REDIS_HOST}:${pod.env.REDIS_PORT}` ===
                      deployedRedisEndpoint
                    : false;

                return (
                  <div
                    key={pod.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {pod.name}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {pod.id}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Cost: {pod.costPerHr ? `$${pod.costPerHr}/hr` : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Image: {pod.imageName || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Machine: {pod.machine?.gpuTypeId || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Vcpu Count: {pod.vcpuCount || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Container Disk: {pod.containerDiskInGb || 'N/A'} GB
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            pod.desiredStatus === 'RUNNING'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                          }`}
                        >
                          {pod.desiredStatus}
                        </span>
                        {isParent && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                            Parent
                          </span>
                        )}
                        {isChild && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200">
                            Child
                          </span>
                        )}
                        <button
                          onClick={() => onDeletePod(pod.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete pod"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>

                    {/* {pod.runtime?.gpus && pod.runtime.gpus.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {pod.runtime.gpus.map((gpu, idx) => (
                        <div
                          key={gpu.id || idx}
                          className="text-sm bg-gray-50 dark:bg-gray-900/50 p-2 rounded"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              {gpu.gpuType}
                            </span>
                            {gpu.publicIp && (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-blue-600 dark:text-blue-400">
                                  {gpu.publicIp}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(gpu.publicIp!)}
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                  title="Copy IP"
                                >
                                  <PiCopySimpleLight
                                    size={16}
                                    className="text-gray-600 dark:text-gray-300"
                                  />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )} */}

                    {!hasRedisEnv && pod?.publicIp && pod.portMappings && (
                      <div className="mt-3 flex items-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Ports: {pod.publicIp}:
                          {Object.values(pod.portMappings).join(', ')}
                        </p>

                        <CopyToClipboard
                          text={`${pod.publicIp}:${Object.values(
                            pod.portMappings,
                          ).join(', ')}`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && pods.length === 0 && (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              No running pods found. Click "Refresh Pods" to check for running
              pods.
            </p>
          )}
        </>
      )}
    </div>
  );
}
