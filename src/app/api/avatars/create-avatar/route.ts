//app/api/avatars/create-avatar/route.js
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/utils/mongodb';
import { uploadFile } from '@/utils/fileUtils';

const MONGODB_DB = process.env.MONGODB_DB || 'aafactory_db';

async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db(MONGODB_DB);
  return { client, db };
}

// POST - Create new avatar
export async function POST(req) {
  try {
    const { db } = await connectToDatabase();

    const contentType = req.headers.get('content-type');
    let avatarData;
    let uploadResult = null;

    // Handle form data (with file upload)
    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();

      // Extract avatar data from form
      avatarData = {
        name: formData.get('name'),
        personality: formData.get('personality'),
        backgroundKnowledge: formData.get('backgroundKnowledge'),
        voiceModel: formData.get('voiceModel') || 'elevenlabs',
        hasEncodedData: formData.get('hasEncodedData') === 'true'
      };

      // Handle file upload if present
      const file = formData.get('file');
      if (file && file.size > 0) {
        const fileName = formData.get('fileName') || file.name;
        uploadResult = await uploadFile(file, fileName);

        // Add file information to avatar data
        avatarData.src = uploadResult.filePath;
        avatarData.fileName = uploadResult.fileName;
      }
    }
    // Handle JSON data (without file upload)
    else {
      avatarData = await req.json();
    }

    // Validate required fields
    if (!avatarData.name || !avatarData.personality) {
      return NextResponse.json({
        error: 'Name and personality are required fields'
      }, { status: 400 });
    }

    // Add timestamps
    const avatar = {
      ...avatarData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('avatars').insertOne(avatar);

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      avatar: { ...avatar, _id: result.insertedId },
      uploadResult: uploadResult ? {
        filePath: uploadResult.filePath,
        fileName: uploadResult.fileName
      } : null
    });

  } catch (error) {
    console.error('Error saving avatar:', error);

    // Provide more specific error messages
    if (error.message.includes('upload')) {
      return NextResponse.json({
        error: 'Failed to upload file: ' + error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      error: 'Failed to save avatar: ' + error.message
    }, { status: 500 });
  }
};