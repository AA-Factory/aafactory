// app/api/avatars/get-avatar/route.js
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/utils/mongodb';

const MONGODB_DB = process.env.MONGODB_DB || 'aafactory_db';

async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db(MONGODB_DB);
  return { client, db };
}

// GET - Retrieve single avatar by ID
export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Avatar ID is required' }, { status: 400 });
    }

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