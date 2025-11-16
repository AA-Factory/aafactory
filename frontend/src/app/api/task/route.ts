import { NextRequest, NextResponse } from 'next/server';
import { createTask } from '@/lib/taskDb';

// POST - Create new task
export async function POST(req: NextRequest) {
  try {
    const { taskId, avatarId, taskType, taskName, metadata, imagePrompt, videoPrompt, audioPrompt, audioTask } = await req.json();

    if (!taskId || !avatarId || !taskType) {
      return NextResponse.json(
        { error: 'taskId, avatarId, and taskType are required' },
        { status: 400 },
      );
    }

    const task = await createTask({
      taskId,
      avatarId,
      taskType,
      taskName,
      metadata,
      imagePrompt,
      videoPrompt,
      audioPrompt,
      audioTask,
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      {
        error: `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
}
