const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = "aafactory_db";

if (!uri) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

async function checkOrCreateDb() {
  const client = new MongoClient(uri);

  try {
    console.log(`🔍 Connecting to MongoDB at ${uri}...`);
    await client.connect();

    console.log("✅ Connected successfully");

    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();

    const exists = databases.some(db => db.name === dbName);

    if (!exists) {
      console.log(`⚠️ Database "${dbName}" does not exist. Creating it now...`);

      // Create DB by creating a dummy collection and inserting a doc
      const db = client.db(dbName);
      const col = db.collection("init_collection");

      // Insert a dummy doc to create the DB
      await col.insertOne({ createdAt: new Date() });

      console.log(`✅ Database "${dbName}" created with initial collection`);
    } else {
      console.log(`✅ Database "${dbName}" already exists`);
    }
  } catch (err) {
    console.error(`❌ Failed to connect or create DB: ${err.message}`);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkOrCreateDb();
