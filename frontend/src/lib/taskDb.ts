import { getCollection } from './database';
import { saveBase64File, SaveFileResult } from './fileUtils';
import { RESOURCE_CONFIG, ResourceType } from '@/lib/resource/constants';
import { safeDbOperation } from '@/lib/dbOperations';
import { AudioTask, TaskDocument, TaskType } from '@/lib/types/tasks';
import { CeleryTaskStatus } from '@/lib/types/celery'
interface CreateTaskParams {
  taskId: string;
  avatarId: string;
  taskType: TaskType;
  userPrompt?: string;
}

export async function createTask(
  params: CreateTaskParams,
): Promise<TaskDocument> {
  try {
    const collection = await getCollection<TaskDocument>('tasks');
    const taskDoc: TaskDocument = {
      taskId: params.taskId,
      avatarId: params.avatarId,
      status: 'PENDING',
      taskType: params.taskType,
      createdAt: new Date(),
      updatedAt: new Date(),
      userPrompt: params.userPrompt,
    };
    const result = await safeDbOperation(
      'insertAvatar',
      'avatars',
      async () => collection.insertOne(taskDoc),
      taskDoc,
    );

    return {
      ...taskDoc,
      _id: result.insertedId.toString(),
    };
  } catch (error) {
    console.error(
      'issue',
      JSON.stringify(
        error.errInfo.details.schemaRulesNotSatisfied[0].propertiesNotSatisfied,
        null,
        4,
      ),
    );

    console.error('Error creating task:', error);

    return Promise.reject(
      `Failed to create task: ${JSON.stringify(error.errInfo.details.schemaRulesNotSatisfied[0].propertiesNotSatisfied, null, 4)}`,
    );
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: AudioTask['status'],
  error?: string,
): Promise<void> {
  try {
    const collection = await getCollection<TaskDocument>('tasks');

    const updateDoc: Partial<TaskDocument> = {
      status,
      updatedAt: new Date(),
    };

    if (error) {
      updateDoc.error = error;
    }

    const result = await collection.updateOne({ taskId }, { $set: updateDoc });

    if (result.matchedCount === 0) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
  } catch (error) {
    console.error(
      'issue',
      JSON.stringify(
        error.errInfo.details.schemaRulesNotSatisfied[0].propertiesNotSatisfied,
        null,
        4,
      ),
    );

    console.error('Error updating task status:', error);
    throw new Error(
      `Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
export async function createResource(
  taskId: string,
  fileResult: SaveFileResult,
) {
  try {
    const task = await getTask(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    const resourceType = task.taskType as ResourceType;
    if (!RESOURCE_CONFIG[resourceType]) {
      throw new Error(`Unsupported resource type: ${resourceType}`);
    }
    const config = RESOURCE_CONFIG[resourceType];
    const fileInfo = {
      filename: `${taskId}.${fileResult.fileType}`,
      path: `/uploads/${resourceType}/${taskId}.${fileResult.fileType}`,
      url: `/uploads/${resourceType}/${taskId}.${fileResult.fileType}`,
      type: fileResult.fileType,
      size: 1251304, // Placeholder size, replace with actual if available
      resourceType: resourceType,
      uploadedAt: new Date(),
    };

    const resourceCollection = await getCollection(config.collection);
    await resourceCollection.insertOne(fileInfo);
  } catch (error) {
    console.error('Error creating resource:', error);
    throw new Error(
      `Failed to create resource: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function updateTaskWithFile(
  taskId: string,
  base64Data: string,
  status: 'SUCCESS' | 'FAILURE' = 'SUCCESS',
): Promise<SaveFileResult> {
  try {
    const collection = await getCollection<TaskDocument>('tasks');

    // Get task to determine file type
    const task = await collection.findOne({ taskId });
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    // Save the file
    const fileResult = await saveBase64File(
      base64Data,
      taskId,
      task.taskType.toLowerCase() as 'audio' | 'video' | 'image'
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
              fileType: fileResult.fileType,
            },
          },
        },
      },
    );
    // const resourceType = task.taskType as ResourceType;
    // const config = RESOURCE_CONFIG[resourceType];
    // const fileInfo = {
    //   filename: `${taskId}.${fileResult.fileType}`,
    //   path: `/uploads/${resourceType}/${fileResult.fileName}`,
    //   url: `/uploads/${resourceType}/${fileResult.fileName}`,
    //   type: fileResult.fileType,
    //   size: 1251304, // Placeholder size, replace with actual if available
    //   resourceType: resourceType,
    //   uploadedAt: new Date(),
    // };

    // const resourceCollection = await getCollection(config.collection);
    // await resourceCollection.insertOne(fileInfo);
    return fileResult;
  } catch (error) {
    console.error(
      'issue',
      JSON.stringify(
        error.errInfo.details.schemaRulesNotSatisfied[0].propertiesNotSatisfied,
        null,
        4,
      ),
    );

    console.error('Error updating task with file:', error);
    throw new Error(
      `Failed to update task with file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function getTask(taskId: string): Promise<TaskDocument | null> {
  try {
    const collection = await getCollection<TaskDocument>('tasks');
    return await collection.findOne({ taskId });
  } catch (error) {
    console.error('Error getting task:', error);
    throw new Error(
      `Failed to get task: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function getTasks(
  avatarId: string,
  taskType?: TaskType,
  status?: CeleryTaskStatus,
): Promise<TaskDocument[]> {
  try {
    const collection = await getCollection<TaskDocument>('tasks');
    const query: any = { avatarId };
    if (taskType) query.taskType = taskType;
    if (status) query.status = status;
    return await collection.find(query).sort({ createdAt: -1 }).toArray();
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw new Error(
      `Failed to get tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function getTasksByAvatar(
  avatarId: string,
): Promise<TaskDocument[]> {
  try {
    const collection = await getCollection<TaskDocument>('tasks');
    return await collection
      .find({ avatarId })
      .sort({ createdAt: -1 })
      .toArray();
  } catch (error) {
    console.error('Error getting tasks by avatar:', error);
    throw new Error(
      `Failed to get tasks by avatar: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    const collection = await getCollection<TaskDocument>('tasks');

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
    throw new Error(
      `Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function deleteOldPendingTasks(
  avatarId: string,
  taskType?: TaskType,
  hoursOld: number = 24,
): Promise<number> {
  try {
    const collection = await getCollection<TaskDocument>('tasks');
    const cutoffDate = new Date(Date.now() - hoursOld * 60 * 60 * 1000);

    const query: any = {
      avatarId,
      status: 'PENDING',
      createdAt: { $lt: cutoffDate },
    };

    if (taskType) {
      query.taskType = taskType;
    }

    const result = await collection.deleteMany(query);
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting old pending tasks:', error);
    throw new Error(
      `Failed to delete old pending tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
