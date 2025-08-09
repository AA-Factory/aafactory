// // app/api/avatars/route.js
// import { NextRequest, NextResponse } from 'next/server';
// import clientPromise from '@/utils/mongodb';
// import { uploadFile } from '@/utils/fileUtils';

// const MONGODB_DB = process.env.MONGODB_DB || 'aafactory_db';

// async function connectToDatabase() {
//   const client = await clientPromise;
//   const db = client.db(MONGODB_DB);
//   return { client, db };
// }

// // POST - Create new avatar
// export async function POST(req) {
//   try {
//     const { db } = await connectToDatabase();

//     const contentType = req.headers.get('content-type');
//     let avatarData;
//     let uploadResult = null;

//     // Handle form data (with file upload)
//     if (contentType?.includes('multipart/form-data')) {
//       const formData = await req.formData();

//       // Extract avatar data from form
//       avatarData = {
//         name: formData.get('name'),
//         personality: formData.get('personality'),
//         backgroundKnowledge: formData.get('backgroundKnowledge'),
//         voiceModel: formData.get('voiceModel') || 'elevenlabs',
//         hasEncodedData: formData.get('hasEncodedData') === 'true'
//       };

//       // Handle file upload if present
//       const file = formData.get('file');
//       if (file && file.size > 0) {
//         const fileName = formData.get('fileName') || file.name;
//         uploadResult = await uploadFile(file, fileName);

//         // Add file information to avatar data
//         avatarData.src = uploadResult.filePath;
//         avatarData.fileName = uploadResult.fileName;
//       }
//     }
//     // Handle JSON data (without file upload)
//     else {
//       avatarData = await req.json();
//     }

//     // Validate required fields
//     if (!avatarData.name || !avatarData.personality) {
//       return NextResponse.json({
//         error: 'Name and personality are required fields'
//       }, { status: 400 });
//     }

//     // Add timestamps
//     const avatar = {
//       ...avatarData,
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };

//     const result = await db.collection('avatars').insertOne(avatar);

//     return NextResponse.json({
//       success: true,
//       id: result.insertedId,
//       avatar: { ...avatar, _id: result.insertedId },
//       uploadResult: uploadResult ? {
//         filePath: uploadResult.filePath,
//         fileName: uploadResult.fileName
//       } : null
//     });

//   } catch (error) {
//     console.error('Error saving avatar:', error);

//     // Provide more specific error messages
//     if (error.message.includes('upload')) {
//       return NextResponse.json({
//         error: 'Failed to upload file: ' + error.message
//       }, { status: 500 });
//     }

//     return NextResponse.json({
//       error: 'Failed to save avatar: ' + error.message
//     }, { status: 500 });
//   }
// }

// // GET - Retrieve all avatars
// export async function GET(req) {
//   try {
//     const { db } = await connectToDatabase();

//     // Get query parameters for filtering/pagination if needed
//     const url = new URL(req.url);
//     const limit = parseInt(url.searchParams.get('limit')) || 50;
//     const skip = parseInt(url.searchParams.get('skip')) || 0;
//     const search = url.searchParams.get('search');

//     let query = {};

//     // Add search functionality if search parameter is provided
//     if (search) {
//       query = {
//         $or: [
//           { name: { $regex: search, $options: 'i' } },
//           { personality: { $regex: search, $options: 'i' } }
//         ]
//       };
//     }

//     // Get avatars with optional filtering and pagination
//     const avatars = await db.collection('avatars')
//       .find(query)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .toArray();

//     // Get total count for pagination
//     const totalCount = await db.collection('avatars').countDocuments(query);

//     return NextResponse.json({
//       avatars,
//       pagination: {
//         total: totalCount,
//         limit,
//         skip,
//         hasMore: skip + limit < totalCount
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching avatars:', error);
//     return NextResponse.json({
//       error: 'Failed to fetch avatars: ' + error.message
//     }, { status: 500 });
//   }
// }