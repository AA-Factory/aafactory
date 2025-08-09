// app/api/avatars/[id]/route.js
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

// GET - Retrieve single avatar by ID
export async function GET(req, { params }) {
  try {
    const { db } = await connectToDatabase();
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid avatar ID' }, { status: 400 });
    }

    const avatar = await db.collection('avatars').findOne({ _id: new ObjectId(id) });

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }

    return NextResponse.json({ avatar });

  } catch (error) {
    console.error('Error fetching avatar:', error);
    return NextResponse.json({ error: 'Failed to fetch avatar' }, { status: 500 });
  }
}

// PUT - Update avatar by ID
export async function PUT(req, { params }) {
  try {
    const { db } = await connectToDatabase();
    const { id } = params;
    const updateData = await req.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid avatar ID' }, { status: 400 });
    }

    // Remove _id from updateData if it exists
    const { _id, ...dataToUpdate } = updateData;

    const result = await db.collection('avatars').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...dataToUpdate,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }

    // Get the updated avatar
    const updatedAvatar = await db.collection('avatars').findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      avatar: updatedAvatar
    });

  } catch (error) {
    console.error('Error updating avatar:', error);
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
  }
}

// DELETE - Delete avatar by ID
export async function DELETE(req, { params }) {
  try {
    const { db } = await connectToDatabase();
    const { id } = params;

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