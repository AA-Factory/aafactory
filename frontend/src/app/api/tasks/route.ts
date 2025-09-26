import { NextRequest, NextResponse } from "next/server";
import { createTask, getTask, getTasksByAvatar } from "@/lib/taskDb";

// POST - Create new task
export async function POST(req: NextRequest) {
  try {
    const { taskId, avatarId, taskType, userPrompt } = await req.json();

    if (!taskId || !avatarId || !taskType) {
      return NextResponse.json(
        { error: "taskId, avatarId, and taskType are required" },
        { status: 400 }
      );
    }

    const task = await createTask({
      taskId,
      avatarId,
      taskType,
      userPrompt
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// GET - Get task by ID or tasks by avatar
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    const avatarId = searchParams.get('avatarId');

    if (taskId) {
      const task = await getTask(taskId);
      if (!task) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ task });
    }

    if (avatarId) {
      const tasks = await getTasksByAvatar(avatarId);
      return NextResponse.json({ tasks });
    }

    return NextResponse.json(
      { error: "Either taskId or avatarId parameter is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error getting task(s):", error);
    return NextResponse.json(
      { error: `Failed to get task(s): ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}