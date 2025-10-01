import { NextRequest, NextResponse } from 'next/server';
import { createTask } from '@/lib/taskDb';

// POST - Create new task
export async function POST(req: NextRequest) {
  try {
    const { taskId, avatarId, taskType, userPrompt } = await req.json();

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
      userPrompt,
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Error creating task:', error);
    if (
      typeof error === 'object' &&
      error !== null &&
      'errInfo' in error &&
      typeof (error as any).errInfo === 'object' &&
      (error as any).errInfo !== null &&
      'details' in (error as any).errInfo &&
      typeof (error as any).errInfo.details === 'object' &&
      (error as any).errInfo.details !== null &&
      Array.isArray((error as any).errInfo.details.schemaRulesNotSatisfied) &&
      (error as any).errInfo.details.schemaRulesNotSatisfied.length > 0 &&
      'propertiesNotSatisfied' in (error as any).errInfo.details.schemaRulesNotSatisfied[0]
    ) {
      console.log(
        'Validation Error Details:',
        JSON.stringify(
          (error as any).errInfo.details.schemaRulesNotSatisfied[0].propertiesNotSatisfied,
          null,
          4,
        ),
      );
    }

    return NextResponse.json(
      {
        error: `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
}
