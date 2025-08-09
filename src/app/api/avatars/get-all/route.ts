
// src/app/api/avatars/get-all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/utils/mongodb';


const MONGODB_DB = process.env.MONGODB_DB || 'aafactory_db';

async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db(MONGODB_DB);
  return { client, db };
}

// GET - Retrieve all avatars
export async function GET(req) {
  try {
    const { db } = await connectToDatabase();

    // Get query parameters for filtering/pagination if needed
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const skip = parseInt(url.searchParams.get('skip')) || 0;
    const search = url.searchParams.get('search');

    let query = {};

    // Add search functionality if search parameter is provided
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { personality: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Get avatars with optional filtering and pagination
    const avatars = await db.collection('avatars')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalCount = await db.collection('avatars').countDocuments(query);

    return NextResponse.json({
      avatars,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching avatars:', error);
    return NextResponse.json({
      error: 'Failed to fetch avatars: ' + error.message
    }, { status: 500 });
  }
}