import { Db, Collection } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const MONGODB_DB = process.env.MONGODB_DB || 'aafactory_db';

async function connectToDatabase(): Promise<Db> {
  try {
    const client = await clientPromise;
    return client.db(MONGODB_DB);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function getCollection<T>(
  collectionName: string,
): Promise<Collection<T>> {
  const database = await connectToDatabase();
  return database.collection<T>(collectionName);
}
export interface TaskDocument {
  _id?: string;
  taskId: string;
  avatarId: string;
  status: 'PENDING' | 'RECEIVED' | 'STARTED' | 'SUCCESS' | 'FAILURE';
  taskType: 'audio' | 'video' | 'image';
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
