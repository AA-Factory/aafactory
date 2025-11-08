import { NextRequest, NextResponse } from 'next/server';
import {
  updateTaskStatus,
  updateTaskWithFile,
  getTask,
  deleteTask,
  createResource,
} from '@/lib/taskDb';

// PUT - Update task status or with file
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;
    const body = await req.json();

    if (body.base64Data) {
      // Update task with file
      const { base64Data, status = 'SUCCESS' } = body;
      const fileResult = await updateTaskWithFile(taskId, base64Data, status);
      await createResource(taskId, fileResult);
      return NextResponse.json({
        success: true,
        message: 'Task updated with file',
        fileResult,
      });
    } else {
      // Update task status only
      const { status, error } = body;
      if (!status) {
        return NextResponse.json(
          { error: 'status is required' },
          { status: 400 },
        );
      }

      await updateTaskStatus(taskId, status, error);
      return NextResponse.json({
        success: true,
        message: 'Task status updated',
      });
    }
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      {
        error: `Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
}

// GET - Get specific task
export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } },
) {
  try {
    const { taskId } = await params;
    const task = await getTask(taskId);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error getting task:', error);
    return NextResponse.json(
      {
        error: `Failed to get task: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete task
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;
    await deleteTask(taskId);
    return NextResponse.json({
      success: true,
      message: 'Task deleted',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      {
        error: `Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
}