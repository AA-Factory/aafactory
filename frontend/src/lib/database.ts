import { Db, Collection } from 'mongodb';
import clientPromise from '@/utils/mongodb';

const MONGODB_DB = process.env.MONGODB_DB || 'aafactory_db';

export async function connectToDatabase(): Promise<Db> {
  try {
    const client = await clientPromise;
    return client.db(MONGODB_DB);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function getTasksCollection(): Promise<Collection<TaskDocument>> {
  const database = await connectToDatabase();
  return database.collection<TaskDocument>('tasks');
}

export interface TaskDocument {
  _id?: string;
  taskId: string;
  avatarId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILURE';
  taskType: 'AUDIO' | 'VIDEO';
  createdAt: Date;
  updatedAt: Date;
  filePath?: string;
  error?: string;
  userPrompt?: string;
  metadata?: {
    originalRequest?: any;
    resultData?: any;
  };
}