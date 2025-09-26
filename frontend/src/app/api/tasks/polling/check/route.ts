import { NextResponse } from "next/server";
import { getPendingVideoTasks } from "@/lib/taskDb";
import { CELERY_TASK_STATUS_SERVER } from "@/config/constants";
import { updateTaskStatus, updateTaskWithFile } from "@/lib/taskDb";
import { isCeleryTaskStatusResponse } from "@/types/celery";

export async function POST() {
  try {
    console.log('🔍 Manual check for pending video tasks...');

    // Get all pending video tasks
    const pendingTasks = await getPendingVideoTasks();

    if (pendingTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending video tasks found',
        pendingCount: 0,
        checkedTasks: []
      });
    }

    console.log(`📋 Found ${pendingTasks.length} pending video tasks to check`);

    const checkedTasks = [];
    let updatedCount = 0;

    // Check each pending task
    for (const task of pendingTasks) {
      try {
        console.log(`🔄 Checking task: ${task.taskId}`);

        // Check status from Celery backend using server-side URL
        const statusUrl = `${CELERY_TASK_STATUS_SERVER}${task.taskId}`;

        const statusResponse = await fetch(statusUrl);

        if (!statusResponse.ok) {
          console.log(`❌ Failed to check status for task ${task.taskId}: ${statusResponse.status}`);
          continue;
        }

        const taskResult = await statusResponse.json();

        if (!isCeleryTaskStatusResponse(taskResult)) {
          console.log(`❌ Invalid response for task ${task.taskId}`);
          continue;
        }

        let statusChanged = false;

        if (taskResult.status === 'SUCCESS') {
          if (taskResult.result) {
            // Save file and update task
            await updateTaskWithFile(task.taskId, taskResult.result, 'SUCCESS');
            console.log(`✅ Task ${task.taskId} completed successfully`);
            statusChanged = true;
            updatedCount++;
          } else {
            await updateTaskStatus(task.taskId, 'FAILURE', 'No result returned from task');
            console.log(`❌ Task ${task.taskId} failed: No result`);
            statusChanged = true;
            updatedCount++;
          }
        } else if (taskResult.status === 'FAILURE') {
          const errorMessage = taskResult.error || 'Task failed';
          await updateTaskStatus(task.taskId, 'FAILURE', errorMessage);
          console.log(`❌ Task ${task.taskId} failed: ${errorMessage}`);
          statusChanged = true;
          updatedCount++;
        } else if (taskResult.status === 'STARTED' || taskResult.status === 'PENDING') {
          // Update to IN_PROGRESS if not already
          await updateTaskStatus(task.taskId, 'IN_PROGRESS');
          console.log(`🔄 Task ${task.taskId} is in progress`);
          statusChanged = true;
          updatedCount++;
        } else if (taskResult.status === 'RETRY') {
          // Update to IN_PROGRESS if not already
          await updateTaskStatus(task.taskId, 'IN_PROGRESS');
          console.log(`🔄 Task ${task.taskId} is in progress`);
          statusChanged = true;
          updatedCount++;
        }

        checkedTasks.push({
          taskId: task.taskId,
          oldStatus: 'PENDING',
          newStatus: taskResult.status,
          statusChanged
        });

      } catch (error) {
        console.error(`❌ Error checking task ${task.taskId}:`, error);
        checkedTasks.push({
          taskId: task.taskId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ Manual check complete. Updated ${updatedCount} tasks.`);

    return NextResponse.json({
      success: true,
      message: `Checked ${pendingTasks.length} pending tasks, updated ${updatedCount} tasks`,
      pendingCount: pendingTasks.length,
      updatedCount,
      checkedTasks
    });

  } catch (error) {
    console.error("❌ Error in manual pending tasks check:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to check pending tasks: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}