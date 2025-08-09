// app/api/avatars/update-avatar/route.js
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/utils/mongodb';
import { uploadFile } from '@/utils/fileUtils';

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
    const contentType = req.headers.get('content-type');

    let requestData;
    let fileData = null;
    let fileName = null;
    let uploadResult = null;
    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle FormData (with file upload)
      const formData = await req.formData();

      // Extract form fields
      requestData = {
        id: formData.get('id'),
        name: formData.get('name'),
        personality: formData.get('personality'),
        backgroundKnowledge: formData.get('backgroundKnowledge'),
        voiceModel: formData.get('voiceModel'),
        hasEncodedData: formData.get('hasEncodedData') === 'true',
      };

      // Extract file if present
      const file = formData.get('file');
      fileName = formData.get('fileName');

      if (file && file.size > 0) {
        uploadResult = await uploadFile(file, fileName);
      }

    } else {
      requestData = await req.json();
    }

    const { id, ...updateData } = requestData;
    if (!id) {
      return NextResponse.json({ error: 'Avatar ID is required' }, { status: 400 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid avatar ID' }, { status: 400 });
    }

    // Remove _id from updateData if it exists
    const { _id, ...dataToUpdate } = updateData;

    // Save file to filesystem if provided
    if (uploadResult) {
      const uniqueFileName = uploadResult.fileName || fileName || `avatar-${Date.now()}.png`;
      dataToUpdate.fileName = uniqueFileName;
      dataToUpdate.src = `/uploads/avatars/${uniqueFileName}`;
      dataToUpdate.hasFileUpload = true;

    }

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

    const updatedAvatar = await db.collection('avatars').findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      avatar: updatedAvatar,
      uploadResult: uploadResult ? {
        filePath: uploadResult.filePath,
        fileName: uploadResult.fileName
      } : null
    });

  } catch (error) {
    console.error('Error updating avatar:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({
      error: 'Failed to update avatar',
      details: error.message
    }, { status: 500 });
  }
}