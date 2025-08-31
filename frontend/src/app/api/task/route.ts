import { NextRequest, NextResponse } from "next/server";
import { createTask } from "@/lib/taskDb";

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
    console.log("issuddddddd", JSON.stringify(error.errInfo.details.schemaRulesNotSatisfied[0].propertiesNotSatisfied, null, 4));

    return NextResponse.json(
      { error: `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
