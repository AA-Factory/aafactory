const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/myapp?authSource=admin';
const dbName = 'aafactory_db_test';

if (!uri) {
  console.error('❌ MONGODB_URI is not set');
  process.exit(1);
}

// Seed data for each collection
const seedData = {
  avatars: [
    {
      name: 'John Doe',
      src: '/placeholder-avatar.png',
      fileName: 'placeholder-avatar.png',
    },
  ],
  // tasks: [
  //   {
  //     avatarId: 'avatar-001',
  //     taskType: 'video',
  //     status: 'SUCCESS',
  //     taskId: 'task-001',
  //     metadata: {
  //       duration: 30,
  //       resolution: '1920x1080',
  //     },
  //     createdAt: new Date('2024-01-20T14:00:00Z'),
  //     updatedAt: new Date('2024-01-20T14:05:00Z'),
  //   },
  //   {
  //     avatarId: 'avatar-002',
  //     taskType: 'audio',
  //     status: 'PENDING',
  //     taskId: 'task-002',
  //     metadata: {
  //       duration: 15,
  //     },
  //     createdAt: new Date('2024-01-21T09:00:00Z'),
  //     updatedAt: new Date('2024-01-21T09:00:00Z'),
  //   },
  // ],
  // videos: [
  //   {
  //     videoId: 'video-001',
  //     avatarId: 'avatar-001',
  //     taskId: 'task-001',
  //     url: '/videos/sample-video-1.mp4',
  //     thumbnail: '/videos/sample-video-1-thumb.jpg',
  //     duration: 30,
  //     createdAt: new Date('2024-01-20T14:05:00Z'),
  //     updatedAt: new Date('2024-01-20T14:05:00Z'),
  //   },
  // ],
  // timeline: [
  //   {
  //     timelineId: 'timeline-001',
  //     avatarId: 'avatar-001',
  //     events: [
  //       {
  //         timestamp: 0,
  //         type: 'start',
  //         data: {},
  //       },
  //       {
  //         timestamp: 5000,
  //         type: 'speak',
  //         data: { text: 'Hello, world!' },
  //       },
  //     ],
  //     createdAt: new Date('2024-01-20T14:00:00Z'),
  //     updatedAt: new Date('2024-01-20T14:00:00Z'),
  //   },
  // ],
};

async function seedDatabase() {
  const client = new MongoClient(uri);

  try {
    console.log(`🔍 Connecting to MongoDB at ${uri}...`);
    await client.connect();
    console.log('✅ Connected successfully');

    const db = client.db(dbName);

    // Check if --clear flag is passed
    const shouldClear = process.argv.includes('--clear');

    for (const [collectionName, data] of Object.entries(seedData)) {
      const collection = db.collection(collectionName);

      if (shouldClear) {
        console.log(`🗑️  Clearing collection "${collectionName}"...`);
        await collection.deleteMany({});
      }

      if (data.length > 0) {
        console.log(
          `🌱 Seeding ${data.length} documents into "${collectionName}"...`,
        );
        await collection.insertMany(data);
        console.log(`✅ Seeded "${collectionName}"`);
      }
    }

    console.log('🎉 Database seeding completed successfully');
  } catch (err) {
    console.error(`❌ Failed to seed database: ${err.message}`);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedDatabase();
