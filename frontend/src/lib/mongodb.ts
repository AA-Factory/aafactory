// src/lib/mongodb.ts
import { MongoClient } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const options = {};

let clientPromise: Promise<MongoClient>;

// Don't check or connect at import time - only when accessed
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = (async () => {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('Please add MONGODB_URI to your environment variables');
      }
      const client = new MongoClient(uri, options);
      return client.connect();
    })();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = (async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('Please add MONGODB_URI to your environment variables');
    }
    const client = new MongoClient(uri, options);
    return client.connect();
  })();
}

export default clientPromise;