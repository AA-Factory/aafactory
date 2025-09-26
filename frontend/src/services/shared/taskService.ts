import { CELERY_RUN_TASK, CELERY_TASK_STATUS } from "@/config/constants";
import {
  type CeleryTaskRequest,
  type CeleryTaskResponse,
  type CeleryTaskStatusResponse,
  isCeleryTaskResponse,
  isCeleryTaskStatusResponse
} from "@/types/celery";
import { POLLING_CONFIG } from "@/config/constants";

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

export async function startTask(
  requestData: CeleryTaskRequest,
  avatarId: string,
  taskType: 'AUDIO' | 'VIDEO',
  userPrompt?: string
): Promise<string> {
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

    // Create task entry in MongoDB via API
    await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId: result.task_id,
        avatarId,
        taskType,
        userPrompt,
      })
    });

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

  // Update DB status to IN_PROGRESS via API
  await fetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'IN_PROGRESS'
    })
  });

  while (attempts < config.MAX_ATTEMPTS) {
    if (Date.now() - startTime > config.TIMEOUT) {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'FAILURE',
          error: 'Task timeout'
        })
      });
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
          await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'FAILURE',
              error: 'No result returned from task'
            })
          });
          throw new TaskError('No result returned from task', 'NO_RESULT');
        }

        // Save file and update DB with file path via API
        await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base64Data: taskResult.result,
            status: 'SUCCESS'
          })
        });
        return taskResult.result;
      }

      if (taskResult.status === 'FAILURE') {
        const errorMessage = taskResult.error || 'Task failed';
        await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'FAILURE',
            error: errorMessage
          })
        });
        throw new TaskError(errorMessage, 'TASK_FAILED');
      }

      await new Promise(resolve => setTimeout(resolve, config.INTERVAL));
      attempts++;
    } catch (error) {
      if (error instanceof TaskError) {
        // Update DB with failure status if not already updated
        try {
          await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'FAILURE',
              error: error.message
            })
          });
        } catch (dbError) {
          console.error('Failed to update task status in DB:', dbError);
        }
        throw error;
      }

      const errorMessage = `Polling failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'FAILURE',
          error: errorMessage
        })
      });
      throw new TaskError(errorMessage, 'POLLING_ERROR');
    }
  }

  await fetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'FAILURE',
      error: 'Max polling attempts exceeded'
    })
  });
  throw new TaskTimeoutError(taskType.toLowerCase());
}