import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { cleanAllDirectories, cleanSpecificDirectories } from '@/lib/fileUtils';
import { RESOURCE_CONFIG, ResourceType } from '@/lib/resource/constants';

const MONGODB_DB = process.env.MONGODB_DB || 'aafactory_db';

// POST - Reset database and/or files
export async function POST(req: NextRequest) {
  // Block access in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const resetType = searchParams.get('type') || 'all';
    const collections = searchParams.get('collections')?.split(',') || [];
    const folders = searchParams.get('folders')?.split(',') || [];

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);

    let resetResults = {
      collections: [] as string[],
      folders: [] as string[],
      errors: [] as string[]
    };

    // Complete reset - drop all collections and clean all folders
    if (resetType === 'all') {
      try {
        // Get all collections in the database
        const allCollections = await db.listCollections().toArray();

        // Drop each collection
        for (const collection of allCollections) {
          await db.collection(collection.name).drop();
          resetResults.collections.push(collection.name);
        }

        // Clean all upload directories
        await cleanAllDirectories();
        resetResults.folders.push('video', 'audio', 'image');

        return NextResponse.json({
          success: true,
          message: 'Complete database and file reset completed',
          reset: resetResults
        });

      } catch (error) {
        resetResults.errors.push(`Complete reset error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Selective reset
    if (resetType === 'selective') {
      // Reset specific collections
      if (collections.length > 0) {
        for (const collectionName of collections) {
          try {
            const collection = db.collection(collectionName);
            await collection.deleteMany({});
            resetResults.collections.push(collectionName);
          } catch (error) {
            resetResults.errors.push(`Collection ${collectionName} reset error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Reset specific folders
      if (folders.length > 0) {
        try {
          await cleanSpecificDirectories(folders);
          resetResults.folders.push(...folders);
        } catch (error) {
          resetResults.errors.push(`Folders reset error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Collections only reset
    if (resetType === 'collections') {
      try {
        const defaultCollections = ['avatars', 'timeline', 'tasks'];
        // Add resource collections from config
        Object.values(RESOURCE_CONFIG).forEach(config => {
          if (!defaultCollections.includes(config.collection)) {
            defaultCollections.push(config.collection);
          }
        });

        for (const collectionName of defaultCollections) {
          try {
            const collection = db.collection(collectionName);
            await collection.deleteMany({});
            resetResults.collections.push(collectionName);
          } catch (error) {
            resetResults.errors.push(`Collection ${collectionName} reset error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Database collections reset completed',
          reset: resetResults
        });

      } catch (error) {
        resetResults.errors.push(`Collections reset error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Files only reset
    if (resetType === 'files') {
      try {
        await cleanAllDirectories();
        resetResults.folders.push('video', 'audio', 'image');

        return NextResponse.json({
          success: true,
          message: 'Upload directories reset completed',
          reset: resetResults
        });

      } catch (error) {
        resetResults.errors.push(`Files reset error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: resetResults.errors.length === 0,
      message: resetResults.errors.length === 0 ? 'Reset completed' : 'Reset completed with errors',
      reset: resetResults
    });

  } catch (error) {
    console.error('Error in database reset:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset database/files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}