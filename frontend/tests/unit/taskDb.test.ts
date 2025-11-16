import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  createTask,
  updateTaskStatus,
  createResource,
  updateTaskWithFile,
  getTask,
  getTasks,
  getTasksByAvatar,
  deleteTask,
  deleteOldPendingTasks,
} from '../../src/lib/taskDb';
import { getCollection } from '@/lib/database';
import type { TaskDocument, TaskType } from '@/lib/types/tasks';
import type { SaveFileResult } from '@/lib/fileUtils';
import fs from 'fs';
import path from 'path';
import {
  createAvatar,
  clearCollection,
  closeDatabaseConnection,
  getAllAvatars,
  getAvatarById,
  deleteAvatar,
} from '../e2e/helpers/db-helpers';
describe('TaskDb', () => {
  const testAvatarId = 'test-avatar-123';
  const testTaskId = 'test-task-456';

  beforeEach(async () => {
    await clearCollection('tasks');
    await clearCollection('videos');
    await clearCollection('audios');
  });
  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe('createTask', () => {

    it('should insert task document into MongoDB', async () => {
      const params = {
        taskId: testTaskId,
        avatarId: testAvatarId,
        taskType: 'audio' as TaskType,
        taskName: 'Audio Task',
        metadata: {
          taskInfo: {
            dialog: 'Generate audio',
          },
        },
      };

      const result = await createTask(params);

      // Verify returned data
      expect(result.taskId).toBe(testTaskId);
      expect(result.avatarId).toBe(testAvatarId);
      expect(result.status).toBe('PENDING');
      expect(result.taskType).toBe('audio');
      expect(result.metadata?.taskInfo?.dialog).toBe('Generate audio');
      expect(result._id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);

      // Verify actual MongoDB entry
      const collection = await getCollection<TaskDocument>('tasks');
      const dbTask = await collection.findOne({ taskId: testTaskId });

      expect(dbTask).toBeTruthy();
      expect(dbTask?.taskId).toBe(testTaskId);
      expect(dbTask?.avatarId).toBe(testAvatarId);
      expect(dbTask?.status).toBe('PENDING');
      expect(dbTask?.taskType).toBe('audio');
    });

    it('should create multiple tasks for same avatar', async () => {
      await createTask({
        taskId: 'task-1',
        avatarId: testAvatarId,
        taskType: 'audio' as TaskType,
        taskName: 'Audio Task 1',
      });

      await createTask({
        taskId: 'task-2',
        avatarId: testAvatarId,
        taskType: 'video' as TaskType,
        taskName: 'Video Task 2',
      });

      const collection = await getCollection<TaskDocument>('tasks');
      const tasks = await collection.find({ avatarId: testAvatarId }).toArray();

      expect(tasks).toHaveLength(2);
      expect(tasks.map(t => t.taskId)).toContain('task-1');
      expect(tasks.map(t => t.taskId)).toContain('task-2');
    });

  });

  describe('updateTaskStatus', () => {
    beforeEach(async () => {
      await createTask({
        taskId: testTaskId,
        avatarId: testAvatarId,
        taskType: 'audio' as TaskType,
        taskName: 'Audio Task',
      });
    });

    it('should update task status in MongoDB', async () => {
      await updateTaskStatus(testTaskId, 'SUCCESS');

      const collection = await getCollection<TaskDocument>('tasks');
      const dbTask = await collection.findOne({ taskId: testTaskId });

      expect(dbTask?.status).toBe('SUCCESS');
      expect(dbTask?.updatedAt).toBeInstanceOf(Date);
    });

    it('should update task status with error message', async () => {
      await updateTaskStatus(testTaskId, 'FAILURE', 'Processing failed');

      const collection = await getCollection<TaskDocument>('tasks');
      const dbTask = await collection.findOne({ taskId: testTaskId });

      expect(dbTask?.status).toBe('FAILURE');
      expect(dbTask?.error).toBe('Processing failed');
    });

    it('should update updatedAt timestamp', async () => {
      const collection = await getCollection<TaskDocument>('tasks');
      const taskBefore = await collection.findOne({ taskId: testTaskId });
      const oldUpdatedAt = taskBefore?.updatedAt;

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 50));

      await updateTaskStatus(testTaskId, 'SUCCESS');

      const taskAfter = await collection.findOne({ taskId: testTaskId });
      expect(taskAfter?.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt!.getTime());
    });

    it('should throw error for non-existent task', async () => {
      await expect(
        updateTaskStatus('non-existent-task', 'SUCCESS')
      ).rejects.toThrow('Task with ID non-existent-task not found');
    });
  });

  describe('createResource', () => {
    beforeEach(async () => {
      const task = await createTask({
        taskId: testTaskId,
        avatarId: testAvatarId,
        taskType: 'audio' as TaskType,
        taskName: 'Audio Task',
      });
    });

    it('should insert resource document into MongoDB', async () => {
      const fileResult: SaveFileResult = {
        filePath: '/test/uploads/audio/test-task-456.mp3',
        fileName: 'test-task-456.mp3',
        fileType: 'mp3',
      };

      await createResource(testTaskId, fileResult);

      // Verify resource was created
      const resourceCollection = await getCollection('audios');
      const resource = await resourceCollection.findOne({
        filename: 'test-task-456.mp3',
      });

      expect(resource).toBeTruthy();
      expect(resource?.filename).toBe('test-task-456.mp3');
      expect(resource?.path).toBe('/test/uploads/audio/test-task-456.mp3');
      expect(resource?.resourceType).toBe('audio');
      expect(resource?.type).toBe('mp3');
      expect(resource?.uploadedAt).toBeInstanceOf(Date);
    });

    it('should create video resource in correct collection', async () => {
      const task = await createTask({
        taskId: 'video-task',
        avatarId: testAvatarId,
        taskType: 'video' as TaskType,
        taskName: 'Video Task 2',
      });

      const fileResult: SaveFileResult = {
        filePath: '/test/uploads/video/video-task.mp4',
        fileName: 'video-task.mp4',
        fileType: 'mp4',
      };

      await createResource('video-task', fileResult);

      const resourceCollection = await getCollection('videos');
      const resource = await resourceCollection.findOne({
        filename: 'video-task.mp4',
      });

      expect(resource?.resourceType).toBe('video');
      expect(resource?.type).toBe('mp4');
    });
  });

  describe('updateTaskWithFile', () => {
    beforeEach(async () => {
      await createTask({
        taskId: testTaskId,
        avatarId: testAvatarId,
        taskType: 'audio' as TaskType,
        taskName: 'Audio Task',
      });
    });

    it('should update task with file path in MongoDB', async () => {
      // Small valid MP3 base64
      const base64Data = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA';

      const result = await updateTaskWithFile(testTaskId, base64Data);

      expect(result.fileName).toBe(`${testTaskId}.mp3`);

      // Verify database was updated
      const collection = await getCollection<TaskDocument>('tasks');
      const dbTask = await collection.findOne({ taskId: testTaskId });

      expect(dbTask?.status).toBe('SUCCESS');
      expect(dbTask?.filePath).toBe(`/test/uploads/audio/${testTaskId}.mp3`);
      expect(dbTask?.metadata?.resultData?.fileName).toBe(`${testTaskId}.mp3`);
      expect(dbTask?.metadata?.resultData?.fileType).toBe('mp3');

      // Verify file was created on disk
      const filePath = path.join(process.cwd(), 'public', dbTask!.filePath!);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should handle image files', async () => {
      await createTask({
        taskId: 'image-task',
        avatarId: testAvatarId,
        taskType: 'image' as TaskType,
        taskName: 'Image Task',
      });

      // 1x1 transparent PNG
      const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      await updateTaskWithFile('image-task', base64Data);

      const collection = await getCollection<TaskDocument>('tasks');
      const dbTask = await collection.findOne({ taskId: 'image-task' });

      expect(dbTask?.filePath).toContain('.png');
      expect(dbTask?.metadata?.resultData?.fileType).toBe('png');
    });
  });

  describe('getTask', () => {
    it('should retrieve task from MongoDB', async () => {
      await createTask({
        taskId: testTaskId,
        avatarId: testAvatarId,
        taskType: 'audio' as TaskType,
        metadata: {
          taskInfo: {
            dialog: 'Test dialog',
          },
        },
        taskName: 'Audio Task',
      });

      const task = await getTask(testTaskId);

      expect(task).toBeTruthy();
      expect(task?.taskId).toBe(testTaskId);
      expect(task?.avatarId).toBe(testAvatarId);
      expect(task?.metadata?.taskInfo?.dialog).toBe('Test dialog');
    });

    it('should return null for non-existent task', async () => {
      const task = await getTask('non-existent');
      expect(task).toBeNull();
    });
  });

  describe('getTasks', () => {
    beforeEach(async () => {
      await createTask({
        taskId: 'task-1',
        avatarId: testAvatarId,
        taskType: 'audio' as TaskType,
        taskName: 'Audio Task 1',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await createTask({
        taskId: 'task-2',
        avatarId: testAvatarId,
        taskType: 'video' as TaskType,
        taskName: 'Video Task 2',
      });

      await updateTaskStatus('task-1', 'SUCCESS');

      await createTask({
        taskId: 'task-3',
        avatarId: 'other-avatar',
        taskType: 'audio' as TaskType,
        taskName: 'Audio Task',
      });
    });

    it('should get all tasks for avatar', async () => {
      const tasks = await getTasks(testAvatarId);

      expect(tasks).toHaveLength(2);
      expect(tasks.map(t => t.taskId)).toContain('task-1');
      expect(tasks.map(t => t.taskId)).toContain('task-2');
      expect(tasks.map(t => t.taskId)).not.toContain('task-3');
    });

    it('should filter by taskType', async () => {
      const tasks = await getTasks(testAvatarId, 'audio');

      expect(tasks).toHaveLength(1);
      expect(tasks[0].taskId).toBe('task-1');
      expect(tasks[0].taskType).toBe('audio');
    });

    it('should filter by status', async () => {
      const tasks = await getTasks(testAvatarId, undefined, 'SUCCESS');

      expect(tasks).toHaveLength(1);
      expect(tasks[0].taskId).toBe('task-1');
      expect(tasks[0].status).toBe('SUCCESS');
    });

    it('should filter by both taskType and status', async () => {
      const tasks = await getTasks(testAvatarId, 'audio', 'SUCCESS');

      expect(tasks).toHaveLength(1);
      expect(tasks[0].taskId).toBe('task-1');
    });

    it('should return tasks sorted by createdAt descending', async () => {
      const tasks = await getTasks(testAvatarId);

      // task-2 should be first (created later)
      expect(tasks[0].taskId).toBe('task-2');
      expect(tasks[1].taskId).toBe('task-1');
    });
  });

  describe('deleteTask', () => {
    it('should delete task from MongoDB', async () => {
      await createTask({
        taskId: testTaskId,
        avatarId: testAvatarId,
        taskType: 'audio' as TaskType,
        taskName: 'Audio Task',
      });

      const collection = await getCollection<TaskDocument>('tasks');
      const taskBefore = await collection.findOne({ taskId: testTaskId });
      expect(taskBefore).toBeTruthy();

      await deleteTask(testTaskId);

      const taskAfter = await collection.findOne({ taskId: testTaskId });
      expect(taskAfter).toBeNull();
    });

    it('should delete task and associated file', async () => {
      await createTask({
        taskId: testTaskId,
        avatarId: testAvatarId,
        taskType: 'audio' as TaskType,
        taskName: 'Audio Task',
      });

      const base64Data = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0U=';
      await updateTaskWithFile(testTaskId, base64Data);

      const collection = await getCollection<TaskDocument>('tasks');
      const taskBefore = await collection.findOne({ taskId: testTaskId });
      const filePath = path.join(process.cwd(), 'public', taskBefore!.filePath!);

      expect(fs.existsSync(filePath)).toBe(true);

      await deleteTask(testTaskId);

      const taskAfter = await collection.findOne({ taskId: testTaskId });
      expect(taskAfter).toBeNull();
      expect(fs.existsSync(filePath)).toBe(false);
    });
  });

  describe('deleteOldPendingTasks', () => {
    it('should delete old pending tasks from MongoDB', async () => {
      const collection = await getCollection<TaskDocument>('tasks');

      // Create old task
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
      await collection.insertOne({
        taskId: 'old-task',
        avatarId: testAvatarId,
        status: 'PENDING',
        taskType: 'audio',
        taskName: 'Audio Task',
        createdAt: oldDate,
        updatedAt: oldDate,
      });

      // Create recent task
      await createTask({
        taskId: 'recent-task',
        avatarId: testAvatarId,
        taskType: 'audio' as TaskType,
        taskName: 'Audio Task',
      });

      const deletedCount = await deleteOldPendingTasks(testAvatarId, undefined, 24);

      expect(deletedCount).toBe(1);

      const tasks = await collection.find({ avatarId: testAvatarId }).toArray();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].taskId).toBe('recent-task');
    });

    it('should only delete PENDING tasks', async () => {
      const collection = await getCollection<TaskDocument>('tasks');
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000);

      await collection.insertMany([
        {
          taskId: 'old-pending',
          avatarId: testAvatarId,
          status: 'PENDING',
          taskType: 'audio',
          taskName: 'Audio Task',
          createdAt: oldDate,
          updatedAt: oldDate,
        },
        {
          taskId: 'old-success',
          avatarId: testAvatarId,
          status: 'SUCCESS',
          taskType: 'audio',
          taskName: 'Audio Task',
          createdAt: oldDate,
          updatedAt: oldDate,
        },
      ]);

      const deletedCount = await deleteOldPendingTasks(testAvatarId, undefined, 24);

      expect(deletedCount).toBe(1);

      const tasks = await collection.find({ avatarId: testAvatarId }).toArray();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].taskId).toBe('old-success');
    });

    it('should filter by taskType', async () => {
      const collection = await getCollection<TaskDocument>('tasks');
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000);

      await collection.insertMany([
        {
          taskId: 'old-audio',
          avatarId: testAvatarId,
          status: 'PENDING',
          taskType: 'audio',
          taskName: 'Audio Task',
          createdAt: oldDate,
          updatedAt: oldDate,
        },
        {
          taskId: 'old-video',
          avatarId: testAvatarId,
          status: 'PENDING',
          taskType: 'video',
          taskName: 'Video Task',
          createdAt: oldDate,
          updatedAt: oldDate,
        },
      ]);

      const deletedCount = await deleteOldPendingTasks(testAvatarId, 'audio', 24);

      expect(deletedCount).toBe(1);

      const tasks = await collection.find({ avatarId: testAvatarId }).toArray();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].taskId).toBe('old-video');
    });
  });
});