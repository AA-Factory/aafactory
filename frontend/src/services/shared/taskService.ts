import { CELERY_RUN_TASK, CELERY_TASK_STATUS } from "@/config/constants";
import {
  type CeleryTaskRequest,
  type CeleryTaskResponse,
  type CeleryTaskStatusResponse,
  isCeleryTaskResponse,
  isCeleryTaskStatusResponse
} from "@/types/celery";

export const POLLING_CONFIG = {
  AUDIO: {
    INTERVAL: 5000, // 5 seconds
    MAX_ATTEMPTS: 60, // 5 minutes total
    TIMEOUT: 300000, // 5 minutes in ms
  },
  VIDEO: {
    INTERVAL: 50000, // 50 seconds
    MAX_ATTEMPTS: 400, // Total 400 attempts
    TIMEOUT: 9000000, // 9000 seconds = 2.5 hours
  }
} as const;

export class TaskError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TaskError';
  }
}

export class TaskTimeoutError extends TaskError {
  constructor(taskType: string) {
    super(`${taskType} generation timed out. Please try again.`, 'TIMEOUT');
  }
}

export async function startTask(requestData: CeleryTaskRequest): Promise<string> {
  try {
    const response = await fetch(CELERY_RUN_TASK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new TaskError(`Request failed with status: ${response.status}`, 'REQUEST_FAILED');
    }

    const result: CeleryTaskResponse = await response.json();

    if (!isCeleryTaskResponse(result) || result.status !== 'PENDING') {
      throw new TaskError('Failed to start task: Invalid response', 'TASK_START_FAILED');
    }

    return result.task_id;
  } catch (error) {
    if (error instanceof TaskError) throw error;
    throw new TaskError(
      `Failed to start task: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'NETWORK_ERROR'
    );
  }
}

export async function pollTaskStatus(
  taskId: string,
  taskType: 'AUDIO' | 'VIDEO'
): Promise<string> {
  const config = POLLING_CONFIG[taskType];
  let attempts = 0;
  const startTime = Date.now();

  while (attempts < config.MAX_ATTEMPTS) {
    if (Date.now() - startTime > config.TIMEOUT) {
      throw new TaskTimeoutError(taskType.toLowerCase());
    }

    try {
      const statusResponse = await fetch(`${CELERY_TASK_STATUS}${taskId}`);

      if (!statusResponse.ok) {
        throw new TaskError(`Status check failed: ${statusResponse.status}`, 'STATUS_CHECK_FAILED');
      }

      const taskResult: CeleryTaskStatusResponse = await statusResponse.json();

      if (!isCeleryTaskStatusResponse(taskResult)) {
        throw new TaskError('Invalid task status response', 'INVALID_STATUS_RESPONSE');
      }

      if (taskResult.status === 'SUCCESS') {
        if (!taskResult.result) {
          throw new TaskError('No result returned from task', 'NO_RESULT');
        }
        return taskResult.result;
      }

      if (taskResult.status === 'FAILURE') {
        throw new TaskError(taskResult.error || 'Task failed', 'TASK_FAILED');
      }

      await new Promise(resolve => setTimeout(resolve, config.INTERVAL));
      attempts++;
    } catch (error) {
      if (error instanceof TaskError) throw error;
      throw new TaskError(
        `Polling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'POLLING_ERROR'
      );
    }
  }

  throw new TaskTimeoutError(taskType.toLowerCase());
}