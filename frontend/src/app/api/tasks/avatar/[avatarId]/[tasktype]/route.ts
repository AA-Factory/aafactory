//api/tasks/avatar/[avatarId]/[tasktype]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTasksByAvatar } from '@/lib/taskDb';

// Supported task types
const SUPPORTED_TASK_TYPES = ['video', 'audio', 'image'] as const;
type TaskType = (typeof SUPPORTED_TASK_TYPES)[number];

function isValidTaskType(taskType: string): taskType is TaskType {
  return SUPPORTED_TASK_TYPES.includes(taskType as TaskType);
}

// GET - Get tasks by avatar ID and task type
export async function GET(
  req: NextRequest,
  { params }: { params: { tasktype: string; avatarId: string } },
) {
  try {
    const { tasktype, avatarId } = params;

    // Validate task type
    if (!isValidTaskType(tasktype)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported task type: ${tasktype}. Supported types: ${SUPPORTED_TASK_TYPES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Validate avatarId
    if (!avatarId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Avatar ID is required',
        },
        { status: 400 },
      );
    }

    // Get all tasks for the avatar
    const allTasks = await getTasksByAvatar(avatarId);

    // Filter for successful tasks of the specified type only
    const filteredTasks = allTasks.filter((task) => task.taskType === tasktype);

    return NextResponse.json({
      success: true,
      tasks: filteredTasks.map((task) => ({
        taskType: task.taskType,
        status: task.status,
        taskId: task.taskId,
        userPrompt: task.userPrompt,
        filePath: task.filePath,
        createdAt: task.createdAt,
        fileName: task.metadata?.resultData?.fileName,
      })),
    });
  } catch (error) {
    console.error(
      `❌ Error getting ${params.tasktype || 'unknown'} tasks for avatar ${params.avatarId || 'unknown'}:`,
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: `Failed to get ${params.tasktype || 'unknown'} tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        taskType: params.tasktype,
        avatarId: params.avatarId,
      },
      { status: 500 },
    );
  }
}
