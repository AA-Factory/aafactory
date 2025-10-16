import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { uploadFile, uploadTrainingAudio } from '@/lib/fileUtils';

const MONGODB_DB = process.env.MONGODB_DB || 'aafactory_db';

export async function PUT(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const contentType = req.headers.get('content-type');

    // Then use it:
    let data: any = {};
    let uploadResult = null;
    let audioUploadResult = null;

    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();

      data = {
        id: formData.get('id'),
        name: formData.get('name'),
        personality: formData.get('personality'),
        backgroundKnowledge: formData.get('backgroundKnowledge'),
        description: formData.get('description'),
        category: formData.get('category'),
      };

      // Handle main file upload
      const fileEntry = formData.get('file') as File | null;
      if (fileEntry && fileEntry.size > 0) {
        const fileNameEntry = formData.get('fileName') as string | null;
        const fileName = fileNameEntry || fileEntry.name;

        uploadResult = await uploadFile(fileEntry, fileName, 'image');
        data.fileName = uploadResult.fileName || fileName;
        data.src = uploadResult.filePath;
        data.hasFileUpload = true;
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
      // Handle JSON request
      data = await req.json();
    }

    if (!data.id || !ObjectId.isValid(data.id)) {
      return NextResponse.json(
        { error: 'Valid avatar ID is required' },
        { status: 400 },
      );
    }

    // Prevent overwriting _id
    delete data._id;
    const { id, ...updateFields } = data;

    const result = await db
      .collection('avatars')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateFields, updatedAt: new Date() } },
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }

    const updatedAvatar = await db
      .collection('avatars')
      .findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      avatar: updatedAvatar,
      uploadResult: uploadResult
        ? { filePath: uploadResult.filePath, fileName: uploadResult.fileName }
        : null,
      audioUploadResult: audioUploadResult
        ? {
            filePath: audioUploadResult.filePath,
            fileName: audioUploadResult.fileName,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error updating avatar:', error);
    return NextResponse.json(
      { error: 'Failed to update avatar', details: error.message },
      { status: 500 },
    );
  }
}
