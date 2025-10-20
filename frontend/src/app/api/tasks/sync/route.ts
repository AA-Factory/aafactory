import { NextResponse } from 'next/server';
import {
  updateTaskStatus,
  updateTaskWithFile,
  deleteOldPendingTasks,
} from '@/lib/taskDb';
import {
  CELERY_TASK_STATUS_SERVER,
  MAX_PENDING_TASK_AGE_HOURS,
} from '@/lib/celery/constants';
import { isCeleryTaskStatusResponse } from '@/lib/types/celery';
import { TaskType, TaskDocument } from '@/lib/types/tasks';
import { getCollection } from '@/lib/database';

interface TaskCheckResult {
  taskId: string;
  avatarId: string;
  taskType: TaskType;
  oldStatus: string;
  newStatus: string;
  statusChanged: boolean;
  error?: string;
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

async function getAllPendingTasks(): Promise<TaskDocument[]> {
  try {
    const collection = await getCollection<TaskDocument>('tasks');
    return await collection
      .find({ status: 'PENDING' })
      .sort({ createdAt: -1 })
      .toArray();
  } catch (error) {
    console.error('Error getting pending tasks:', error);
    throw new Error(
      `Failed to get pending tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log(`🔍 Starting task status sync for all pending tasks...`);

    // Delete old pending tasks (older than 24 hours) - no filter by avatarId or taskType
    const collection = await getCollection<TaskDocument>('tasks');
    const cutoffDate = new Date(
      Date.now() - MAX_PENDING_TASK_AGE_HOURS * 60 * 60 * 1000,
    );
    const deleteResult = await collection.deleteMany({
      status: 'PENDING',
      createdAt: { $lt: cutoffDate },
    });

    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️ Deleted ${deleteResult.deletedCount} old pending tasks`);
    }

    // Get all pending tasks
    const pendingTasks = await getAllPendingTasks();

    if (pendingTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending tasks found',
        stats: {
          pending: 0,
          checked: 0,
          updated: 0,
          failed: 0,
        },
        tasks: [],
      });
    }

    console.log(`📋 Found ${pendingTasks.length} pending tasks`);

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
            task.taskType,
          );

          if (statusChanged) {
            updatedCount++;
          }

          return {
            taskId: task.taskId,
            avatarId: task.avatarId,
            taskType: task.taskType,
            oldStatus: 'PENDING',
            newStatus: taskResult.status,
            statusChanged,
          };
        } catch (error) {
          failedCount++;
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.error(
            `❌ ${task.taskType} task ${task.taskId} failed:`,
            errorMessage,
          );

          return {
            taskId: task.taskId,
            avatarId: task.avatarId,
            taskType: task.taskType,
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
      `✅ Sync complete. Updated: ${updatedCount}, Failed: ${failedCount}`,
    );

    return NextResponse.json({
      success: true,
      message: `Synced ${pendingTasks.length} tasks: ${updatedCount} updated, ${failedCount} failed`,
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
    console.error(`❌ Task sync failed:`, errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: `Task sync failed: ${errorMessage}`,
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
