//app/api/avatars/create-avatar/route.js
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/utils/mongodb";
import { uploadFile } from "@/utils/fileUtils";

const MONGODB_DB = process.env.MONGODB_DB || "aafactory_db";

async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db(MONGODB_DB);
  return { client, db };
}

// POST - Create new avatar
export async function POST(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();

    const contentType = req.headers.get("content-type");
    let data;
    let uploadResult = null;

    // Handle form data (with file upload)
    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();

      // Extract avatar data from form
      data = {
        name: formData.get('name') as string | null,
        personality: formData.get('personality') as string | null,
        backgroundKnowledge: formData.get('backgroundKnowledge') as string | null,
        description: formData.get('description') as string | null,
        category: (formData.get('category') as string) || 'realistic',
        voiceModel: (formData.get('voiceModel') as string) || 'elevenlabs',
        hasEncodedData: formData.get('hasEncodedData') === 'true',
        voiceTrainingData: 'rick_and_morty_voice_training.wav'
      };

      // Handle file upload - Next.js way
      const fileEntry = formData.get('file') as File | null;
      if (fileEntry && fileEntry.size > 0) {
        const fileNameEntry = formData.get('fileName') as string | null;
        const fileName = fileNameEntry || fileEntry.name;

        uploadResult = await uploadFile(fileEntry, fileName);

        data.src = uploadResult.filePath;
        data.fileName = uploadResult.fileName;
      }
    } else {
      // Handle JSON data (without file upload)
      data = await req.json();
    }

    // Validate required fields
    if (!data.name || !data.personality) {
      return NextResponse.json(
        {
          error: "Name and personality are required fields",
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

    const result = await db.collection("avatars").insertOne(avatar);

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
    });

  } catch (error: any) {
    console.error('Error saving avatar:', error);

    // Provide more specific error messages
    if (error.message.includes("upload")) {
      return NextResponse.json(
        {
          error: "Failed to upload file: " + error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to save avatar: " + error.message,
      },
      { status: 500 },
    );
  }
}
