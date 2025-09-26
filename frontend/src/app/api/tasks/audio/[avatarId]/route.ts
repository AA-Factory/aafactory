import { NextRequest, NextResponse } from "next/server";
import { getTasksByAvatar } from "@/lib/taskDb";

// GET - Get audio tasks by avatar ID
export async function GET(
  req: NextRequest,
  { params }: { params: { avatarId: string } }
) {
  try {
    const { avatarId } = params;

    // Get all tasks for the avatar
    const allTasks = await getTasksByAvatar(avatarId);

    // Filter for successful audio tasks only
    const audioTasks = allTasks.filter(task =>
      task.taskType === 'AUDIO' &&
      task.status === 'SUCCESS' &&
      task.filePath
    );

    return NextResponse.json({
      success: true,
      audioTasks: audioTasks.map(task => ({
        taskId: task.taskId,
        userPrompt: task.userPrompt || 'Audio Generation',
        filePath: task.filePath,
        createdAt: task.createdAt,
        fileName: task.metadata?.resultData?.fileName
      }))
    });
  } catch (error) {
    console.error("Error getting audio tasks:", error);
    return NextResponse.json(
      { error: `Failed to get audio tasks: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}