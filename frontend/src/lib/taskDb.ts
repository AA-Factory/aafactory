import { getTasksCollection, TaskDocument } from './database';
import { saveBase64File, SaveFileResult } from './fileUtils';

export interface CreateTaskParams {
  taskId: string;
  avatarId: string;
  taskType: 'AUDIO' | 'VIDEO';
  userPrompt?: string;
}

export async function createTask(params: CreateTaskParams): Promise<TaskDocument> {
  console.log('✌️params --->', params);
  try {
    const collection = await getTasksCollection();

    const taskDoc: TaskDocument = {
      taskId: params.taskId,
      avatarId: params.avatarId,
      status: 'PENDING',
      taskType: params.taskType,
      createdAt: new Date(),
      updatedAt: new Date(),
      userPrompt: params.userPrompt,
    };

    const result = await collection.insertOne(taskDoc);

    return {
      ...taskDoc,
      _id: result.insertedId.toString()
    };
  } catch (error) {
    console.error('Error creating task:', error);
    throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILURE',
  error?: string
): Promise<void> {
  try {
    const collection = await getTasksCollection();

    const updateDoc: Partial<TaskDocument> = {
      status,
      updatedAt: new Date()
    };

    if (error) {
      updateDoc.error = error;
    }

    const result = await collection.updateOne(
      { taskId },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
  } catch (error) {
    console.error('Error updating task status:', error);
    throw new Error(`Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateTaskWithFile(
  taskId: string,
  base64Data: string,
  status: 'SUCCESS' | 'FAILURE' = 'SUCCESS'
): Promise<SaveFileResult> {
  try {
    const collection = await getTasksCollection();

    // Get task to determine file type
    const task = await collection.findOne({ taskId });
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    // Save the file
    const fileResult = await saveBase64File(
      base64Data,
      taskId,
      task.taskType.toLowerCase() as 'audio' | 'video'
    );

    // Update task with file path
    await collection.updateOne(
      { taskId },
      {
        $set: {
          status,
          filePath: fileResult.filePath,
          updatedAt: new Date(),
          metadata: {
            resultData: {
              fileName: fileResult.fileName,
              fileType: fileResult.fileType
            }
          }
        }
      }
    );

    return fileResult;
  } catch (error) {
    console.error('Error updating task with file:', error);
    throw new Error(`Failed to update task with file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getTask(taskId: string): Promise<TaskDocument | null> {
  try {
    const collection = await getTasksCollection();
    return await collection.findOne({ taskId });
  } catch (error) {
    console.error('Error getting task:', error);
    throw new Error(`Failed to get task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getTasksByAvatar(avatarId: string): Promise<TaskDocument[]> {
  try {
    const collection = await getTasksCollection();
    return await collection.find({ avatarId }).sort({ createdAt: -1 }).toArray();
  } catch (error) {
    console.error('Error getting tasks by avatar:', error);
    throw new Error(`Failed to get tasks by avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    const collection = await getTasksCollection();

    // Get task to delete associated file
    const task = await collection.findOne({ taskId });
    if (task && task.filePath) {
      try {
        const { deleteFile } = await import('./fileUtils');
        await deleteFile(task.filePath);
      } catch (fileError) {
        console.warn('Could not delete associated file:', fileError);
      }
    }

    await collection.deleteOne({ taskId });
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}