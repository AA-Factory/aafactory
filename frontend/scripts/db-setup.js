
const { MongoClient } = require("mongodb");

const { collections } = require('../schemas'); // ← THE IMPORT

const uri = process.env.MONGODB_URI;
const dbName = "aafactory_db";

if (!uri) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

async function createCollectionWithSchema(db, collectionName, schema) {
  try {
    const existingCollections = await db.listCollections({ name: collectionName }).toArray();

    if (existingCollections.length > 0) {
      console.log(`📋 Collection "${collectionName}" already exists`);
      return;
    }

    await db.createCollection(collectionName, { validator: schema.validator });
    console.log(`✅ Created collection "${collectionName}" with schema validation`);

    if (schema.indexes && schema.indexes.length > 0) {
      await db.collection(collectionName).createIndexes(schema.indexes);
      console.log(`🔍 Created ${schema.indexes.length} indexes for "${collectionName}"`);
    }

  } catch (error) {
    console.error(`❌ Failed to create collection "${collectionName}": ${error.message}`);
    throw error;
  }
}

async function checkOrCreateDb() {
  const client = new MongoClient(uri);

  try {
    console.log(`🔍 Connecting to MongoDB at ${uri}...`);
    await client.connect();
    console.log("✅ Connected successfully");

    const db = client.db(dbName);
    console.log("🏗️ Setting up collections with schema validation...");

    // THIS IS WHERE THE MAGIC HAPPENS - using imported collections
    for (const [collectionName, schema] of Object.entries(collections)) {
      await createCollectionWithSchema(db, collectionName, schema);
    }

    console.log("🎉 Database and collections setup completed successfully");

  } catch (err) {
    console.error(`❌ Failed to connect or setup DB: ${err.message}`);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkOrCreateDb();