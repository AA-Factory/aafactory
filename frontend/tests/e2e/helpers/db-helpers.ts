import { MongoClient, Db, ObjectId } from 'mongodb';

const uri =
  process.env.MONGODB_URI ||
  'mongodb://admin:password@localhost:27017/myapp?authSource=admin';
const dbName = process.env.MONGODB_DB || 'aafactory_db_test';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
  }
  return db!;
}

export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

// Avatar helpers
export async function createAvatar(data: {
  name: string;
  src?: string;
  fileName?: string;
}) {
  const database = await connectToDatabase();
  const avatar = {
    name: data.name,
    src: data.src || '/placeholder-avatar.png',
    fileName: data.fileName || 'placeholder-avatar.png',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await database.collection('avatars').insertOne(avatar);
  return { ...avatar, _id: result.insertedId };
}

export async function getAvatarById(id: string | ObjectId) {
  const database = await connectToDatabase();
  return database
    .collection('avatars')
    .findOne({ _id: new ObjectId(id) });
}

export async function getAllAvatars() {
  const database = await connectToDatabase();
  return database.collection('avatars').find({}).toArray();
}

export async function deleteAvatar(id: string | ObjectId) {
  const database = await connectToDatabase();
  return database
    .collection('avatars')
    .deleteOne({ _id: new ObjectId(id) });
}

// Task helpers
export async function createTask(data: {
  avatarId: string;
  taskType: 'audio' | 'video' | 'image' | 'text';
  status: 'PENDING' | 'RECEIVED' | 'STARTED' | 'SUCCESS' | 'FAILURE';
  taskId: string;
  metadata?: Record<string, any>;
}) {
  const database = await connectToDatabase();
  const task = {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await database.collection('tasks').insertOne(task);
  return { ...task, _id: result.insertedId };
}

export async function getTaskById(taskId: string) {
  const database = await connectToDatabase();
  return database.collection('tasks').findOne({ taskId });
}

export async function getAllTasks() {
  const database = await connectToDatabase();
  return database.collection('tasks').find({}).toArray();
}

export async function deleteTask(taskId: string) {
  const database = await connectToDatabase();
  return database.collection('tasks').deleteOne({ taskId });
}

// Video helpers
export async function createVideo(data: {
  filename: string;
  filepath: string;
  resourceType: 'audio' | 'video';
  url: string;
  type: string;
}) {
  const database = await connectToDatabase();
  const video = {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await database.collection('videos').insertOne(video);
  return { ...video, _id: result.insertedId };
}

export async function getAllVideos() {
  const database = await connectToDatabase();
  return database.collection('videos').find({}).toArray();
}

export async function deleteVideo(id: string | ObjectId) {
  const database = await connectToDatabase();
  return database
    .collection('videos')
    .deleteOne({ _id: new ObjectId(id) });
}

// Cleanup helpers
export async function clearCollection(collectionName: string) {
  const database = await connectToDatabase();
  return database.collection(collectionName).deleteMany({});
}

export async function clearAllCollections() {
  const database = await connectToDatabase();
  const collections = ['avatars', 'tasks', 'videos', 'timeline'];

  for (const collection of collections) {
    await database.collection(collection).deleteMany({});
  }
}

// Seed helpers - useful for setting up test data
export async function seedAvatars(count = 1) {
  const avatars = [];
  for (let i = 0; i < count; i++) {
    const avatar = await createAvatar({
      name: `Test Avatar ${i + 1}`,
      src: `/test-avatar-${i + 1}.png`,
      fileName: `test-avatar-${i + 1}.png`,
    });
    avatars.push(avatar);
  }
  return avatars;
}
