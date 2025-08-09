// app/api/avatars/update-avatar/route.js
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/utils/mongodb';

const MONGODB_DB = process.env.MONGODB_DB || 'aafactory_db';

async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db(MONGODB_DB);
  return { client, db };
}

// PUT - Update avatar by ID
export async function PUT(req) {
  try {
    const { db } = await connectToDatabase();
    const requestData = await req.json();
    const { id, ...updateData } = requestData;

    if (!id) {
      return NextResponse.json({ error: 'Avatar ID is required' }, { status: 400 });
    }

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