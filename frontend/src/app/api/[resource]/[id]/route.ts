// app/api/[resource]/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { RESOURCE_CONFIG, ResourceType } from '@/lib/resource/constants';

const MONGODB_DB = process.env.MONGODB_DB || 'aafactory_db';

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

    // Validate resource type
    if (!Object.keys(RESOURCE_CONFIG).includes(resource)) {
      return NextResponse.json(
        { error: 'Invalid resource type' },
        { status: 400 }
      );
    }

    //the id is the filename so we can use that to find and delte from the database
    const config = RESOURCE_CONFIG[resource as ResourceType];
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);

    // Find the resource in the database
    const resourceDoc = await db.collection(config.collection).findOne({ _id: new ObjectId(id) });

    if (!resourceDoc) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Delete the file from the filesystem in public/uploads
    const filePath = path.join(process.cwd(), 'public/uploads', config.uploadDir, id);
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