// app/api/avatars/delete-avatar/route.js
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/utils/mongodb';
import { deleteFile } from '@/utils/fileUtils';

const MONGODB_DB = process.env.MONGODB_DB || 'aafactory_db';

async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db(MONGODB_DB);
  return { client, db };
}

// DELETE - Delete avatar by ID
export async function DELETE(req) {
  try {
    const { db } = await connectToDatabase();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Avatar ID is required' }, { status: 400 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid avatar ID' }, { status: 400 });
    }

    // Get the avatar before deletion to get file path for cleanup
    const avatar = await db.collection('avatars').findOne({ _id: new ObjectId(id) });

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }

    // Delete from database first
    const result = await db.collection('avatars').deleteOne({ _id: new ObjectId(id) });

    // Clean up associated file if it exists
    if (avatar.src) {
      try {
        await deleteFile(avatar.src);
        console.log('Associated avatar file deleted successfully:', avatar.src);
      } catch (fileError) {
        console.warn('Could not delete associated avatar file:', fileError.message);
        // Don't fail the entire operation if file deletion fails
        // The avatar is already deleted from the database
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      deletedAvatar: avatar,
      message: 'Avatar and associated files deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting avatar:', error);
    return NextResponse.json({ error: 'Failed to delete avatar' }, { status: 500 });
  }
}