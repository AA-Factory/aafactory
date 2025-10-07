import { NextResponse } from 'next/server';
import {
  updateTaskStatus,
  updateTaskWithFile,
  getTasks,
  deleteOldPendingTasks,
} from '@/lib/taskDb';
import { CELERY_TASK_STATUS_SERVER, MAX_PENDING_TASK_AGE_HOURS } from '@/lib/celery/constants';
import { isCeleryTaskStatusResponse } from '@/lib/types/celery';
import { SUPPORTED_TASK_TYPES } from '@/lib/task/constants';
import { TaskType } from '@/lib/types/tasks';
interface TaskCheckResult {
  taskId: string;
  oldStatus: string;
  newStatus: string;
  statusChanged: boolean;
  error?: string;
}

interface SyncParams {
  params: {
    tasktype: string;
    avatarId: string;
  };
}

function isValidTaskType(taskType: string): taskType is TaskType {
  return SUPPORTED_TASK_TYPES.includes(taskType as TaskType);
}

async function checkCeleryTaskStatus(taskId: string): Promise<any> {
  const statusUrl = `${CELERY_TASK_STATUS_SERVER}${taskId}`;
  const response = await fetch(statusUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to fetch task status`);
  }

  const result = await response.json();

  if (!isCeleryTaskStatusResponse(result)) {
    throw new Error('Invalid response format from Celery backend');
  }

  return result;
}

async function updateTaskBasedOnStatus(
  taskId: string,
  taskResult: any,
  taskType: TaskType,
): Promise<boolean> {
  switch (taskResult.status) {
    case 'SUCCESS':
      if (taskResult.result) {
        await updateTaskWithFile(taskId, taskResult.result, 'SUCCESS');
        console.log(`✅ ${taskType} task ${taskId} completed successfully`);
        return true;
      } else {
        await updateTaskStatus(
          taskId,
          'FAILURE',
          'No result returned from task',
        );
        console.log(`❌ ${taskType} task ${taskId} failed: No result`);
        return true;
      }

    case 'FAILURE':
      const errorMessage = taskResult.error || 'Task failed';
      await updateTaskStatus(taskId, 'FAILURE', errorMessage);
      console.log(`❌ ${taskType} task ${taskId} failed: ${errorMessage}`);
      return true;

    case 'STARTED':
    case 'PENDING':
    case 'RETRY':
      await updateTaskStatus(taskId, 'PENDING');
      console.log(`🔄 ${taskType} task ${taskId} is in progress`);
      return true;

    default:
      console.log(
        `ℹ️ ${taskType} task ${taskId} status unchanged: ${taskResult.status}`,
      );
      return false;
  }
}

export async function POST(request: Request, { params }: SyncParams) {
  const { tasktype, avatarId } = params;

  try {
    // Validate task type
    if (!isValidTaskType(tasktype)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported task type: ${tasktype}. Supported types: ${SUPPORTED_TASK_TYPES.join(', ')}`,
          stats: { pending: 0, checked: 0, updated: 0, failed: 0 },
          tasks: [],
        },
        { status: 400 },
      );
    }

    console.log(`🔍 Starting ${tasktype} task status sync...`);

    // Delete old pending tasks (older than 24 hours)
    const deletedCount = await deleteOldPendingTasks(avatarId, tasktype, MAX_PENDING_TASK_AGE_HOURS);
    if (deletedCount > 0) {
      console.log(`🗑️ Deleted ${deletedCount} old pending ${tasktype} tasks`);
    }

    // Get pending tasks for the specified type
    const pendingTasks = await getTasks(avatarId, tasktype, 'PENDING');

    if (pendingTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No pending ${tasktype} tasks found`,
        taskType: tasktype,
        stats: {
          pending: 0,
          checked: 0,
          updated: 0,
          failed: 0,
        },
        tasks: [],
      });
    }

    console.log(`📋 Found ${pendingTasks.length} pending ${tasktype} tasks`);

    const results: TaskCheckResult[] = [];
    let updatedCount = 0;
    let failedCount = 0;

    // Process tasks with controlled concurrency
    const batchSize = 5; // Process 5 tasks at a time to avoid overwhelming the server

    for (let i = 0; i < pendingTasks.length; i += batchSize) {
      const batch = pendingTasks.slice(i, i + batchSize);

      const batchPromises = batch.map(async (task) => {
        try {
          const taskResult = await checkCeleryTaskStatus(task.taskId);
          const statusChanged = await updateTaskBasedOnStatus(
            task.taskId,
            taskResult,
            tasktype,
          );

          if (statusChanged) {
            updatedCount++;
          }

          return {
            taskId: task.taskId,
            oldStatus: 'PENDING',
            newStatus: taskResult.status,
            statusChanged,
          };
        } catch (error) {
          failedCount++;
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.error(
            `❌ ${tasktype} task ${task.taskId} failed:`,
            errorMessage,
          );

          return {
            taskId: task.taskId,
            oldStatus: 'PENDING',
            newStatus: 'ERROR',
            statusChanged: false,
            error: errorMessage,
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });
    }

    console.log(
      `✅ ${tasktype} sync complete. Updated: ${updatedCount}, Failed: ${failedCount}`,
    );

    return NextResponse.json({
      success: true,
      message: `Synced ${pendingTasks.length} ${tasktype} tasks: ${updatedCount} updated, ${failedCount} failed`,
      taskType: tasktype,
      stats: {
        pending: pendingTasks.length,
        checked: results.length,
        updated: updatedCount,
        failed: failedCount,
      },
      tasks: results,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ ${tasktype} task sync failed:`, errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: `${tasktype} task sync failed: ${errorMessage}`,
        taskType: tasktype,
        stats: {
          pending: 0,
          checked: 0,
          updated: 0,
          failed: 0,
        },
        tasks: [],
      },
      { status: 500 },
    );
  }
}
