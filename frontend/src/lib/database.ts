import { Db, Collection } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { Document } from 'mongodb';
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

export async function getCollection<T extends Document>(
  collectionName: string,
): Promise<Collection<T>> {
  const database = await connectToDatabase();
  return database.collection<T>(collectionName);
}
