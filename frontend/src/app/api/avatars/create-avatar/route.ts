//app/api/avatars/create-avatar/route.js
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { uploadFile, uploadTrainingAudio } from '@/lib/fileUtils';
import { DEFAULT_AVATAR_IMAGES } from '@/lib/avatar/constants';

const MONGODB_DB = process.env.MONGODB_DB || 'aafactory_db';

// POST - Create new avatar
export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);

    const contentType = req.headers.get('content-type');
    let data;
    let uploadResult = null;
    let audioUploadResult = null;

    // Handle form data (with file upload)
    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();

      // Extract avatar data from form
      data = {
        name: formData.get('name') as string | null,
        personality: formData.get('personality') as string | null,
        backgroundKnowledge: formData.get('backgroundKnowledge') as
          | string
          | null,
        description: formData.get('description') as string | null,
        category: (formData.get('category') as string) || 'realistic',
        hasEncodedData: formData.get('hasEncodedData') === 'true',
        src: '/placeholder-avatar.png',
        fileName: 'placeholder-avatar.png',
        trainingAudioPath: null as string | null,
        trainingAudioFileName: null as string | null,
      };

      // Handle image file upload - Next.js way
      const fileEntry = formData.get('file') as File | null;
      if (fileEntry && fileEntry.size > 0) {
        const fileNameEntry = formData.get('fileName') as string | null;
        const fileName = fileNameEntry || fileEntry.name;

        uploadResult = await uploadFile(fileEntry, fileName, 'image');

        data.src = uploadResult.filePath;
        data.fileName = uploadResult.fileName;
      }

      // Handle training audio file upload
      const audioEntry = formData.get('trainingAudio') as File | null;
      if (audioEntry && audioEntry.size > 0) {
        audioUploadResult = await uploadTrainingAudio(
          audioEntry,
          audioEntry.name,
        );

        data.trainingAudioPath = audioUploadResult.filePath;
        data.trainingAudioFileName = audioUploadResult.fileName;
      }
    } else {
      // Handle JSON data (without file upload)
      data = await req.json();
      data = {
        ...data,
        src: DEFAULT_AVATAR_IMAGES[Math.floor(Math.random() * DEFAULT_AVATAR_IMAGES.length)].src,
        fileName: DEFAULT_AVATAR_IMAGES[Math.floor(Math.random() * DEFAULT_AVATAR_IMAGES.length)].filename
      };
    }

    // Validate required fields
    if (!data.name || !data.personality) {
      return NextResponse.json(
        {
          error: 'Name and personality are required fields',
        },
        { status: 400 },
      );
    }

    // Add timestamps
    const avatar = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('avatars').insertOne(avatar);

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      avatar: { ...avatar, _id: result.insertedId },
      uploadResult: uploadResult
        ? {
          filePath: uploadResult.filePath,
          fileName: uploadResult.fileName,
        }
        : null,
      audioUploadResult: audioUploadResult
        ? {
          filePath: audioUploadResult.filePath,
          fileName: audioUploadResult.fileName,
        }
        : null,
    });
  } catch (error: any) {
    console.error('Error saving avatar:', error);

    // Provide more specific error messages
    if (error.message.includes('upload')) {
      return NextResponse.json(
        {
          error: 'Failed to upload file: ' + error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to save avatar: ' + error.message,
      },
      { status: 500 },
    );
  }
}
