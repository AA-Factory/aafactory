// app/api/[resource]/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { connectToDatabase } from '@/utils/mongodb';
import { ObjectId } from 'mongodb';

// Import your RESOURCE_CONFIG from the parent route or a shared file
const RESOURCE_CONFIG = {
  video: {
    allowedTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime'],
    maxSize: 100 * 1024 * 1024,
    uploadDir: 'uploads/videos',
    collection: 'videos'
  },
  audio: {
    allowedTypes: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'],
    maxSize: 50 * 1024 * 1024,
    uploadDir: 'uploads/audios',
    collection: 'audios'
  },
  image: {
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024,
    uploadDir: 'uploads/images',
    collection: 'images'
  }
} as const;

type ResourceType = keyof typeof RESOURCE_CONFIG;

interface RouteParams {
  params: {
    resource: string;
    id: string;
  };
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { resource, id } = params;
    console.log('✌️ id --->', id);
    console.log('✌️resource --->', resource);

    // Validate resource type
    if (!Object.keys(RESOURCE_CONFIG).includes(resource)) {
      return NextResponse.json(
        { error: 'Invalid resource type' },
        { status: 400 }
      );
    }

    //the id is the filename so we can use that to find and delte from the database
    const config = RESOURCE_CONFIG[resource as ResourceType];
    const { db } = await connectToDatabase();

    // Find the resource in the database
    const resourceDoc = await db.collection(config.collection).findOne({ filename: id });

    if (!resourceDoc) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Delete the file from the filesystem in public/uploads
    const filePath = path.join(process.cwd(), 'public', config.uploadDir, id);
    await unlink(filePath);

    // Delete the resource from the database
    await db.collection(config.collection).deleteOne({ _id: new ObjectId(resourceDoc._id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 